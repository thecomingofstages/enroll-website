const crypto = require('crypto');
const bcrypt    = require('bcrypt');
const { v7: uuidv7 } = require('uuid');
const UserModel = require('../models/User.model');
const PasswordResetTokenModel = require('../models/PasswordResetToken.model');
const JWTUtil   = require('../utils/JWT.util');
const AppKeys   = require('../config/app.keys');
const { sendPasswordResetEmail } = require('../utils/Email.util');

class AuthHelper {

  // ── POST /auth/register ────────────────────────────────────────
  static async register(payload) {
    const { first_name, last_name, nickname, email, phone, password, gender, interests } = payload;

    if (!first_name || !last_name || !nickname || !email || !phone || !password || !gender) {
      const err = new Error('Missing required fields.');
      err.code = 'VALIDATION_ERROR';
      err.status = 400;
      throw err;
    }

    if (password.length < 8) {
      const err = new Error('Password must be at least 8 characters.');
      err.code = 'VALIDATION_ERROR';
      err.field = 'password';
      err.status = 400;
      throw err;
    }

    const existing = await UserModel.findOne({ email: email.toLowerCase() }).lean();
    if (existing) {
      const err = new Error('Email already registered.');
      err.code = 'DUPLICATE_EMAIL';
      err.status = 409;
      throw err;
    }

    const password_hash = await bcrypt.hash(password, AppKeys.BCRYPT_ROUNDS);

    const user = await UserModel.create({
      first_name,
      last_name,
      nickname,
      email,
      phone,
      password_hash,
      gender,
      interests: interests || [],
      address: payload.address || null,
      education_level: payload.education_level || null,
      institution: payload.institution || null,
    });

    const { password_hash: _, ...sanitized } = user.toObject();
    return sanitized;
  }

  // ── POST /auth/login ───────────────────────────────────────────
  /**
   * Authenticate a user by email + password.
   * Returns { accessToken, refreshToken, user } on success.
   * Always throws a generic 401 on failure (no user enumeration).
   */
  static async login(email, password) {
    // 1. Find user by email (lowercase — model enforces lowercase: true)
    const user = await UserModel.findOne({ email: email.toLowerCase().trim() }).lean();

    // Generic error — same message whether email unknown or password wrong
    const authErr = Object.assign(
      new Error('Invalid email or password.'),
      { statusCode: 401, code: 'INVALID_CREDENTIALS' }
    );

    if (!user) throw authErr;

    // 2. Compare plaintext password against stored hash
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) throw authErr;

    // 3. Build JWT payload  (sub = user _id, role for admin guards)
    const jwtPayload = {
      sub:      user._id,
      nickname: user.nickname,
      role:     user.role || 'user',
    };

    const accessToken  = JWTUtil.signAccess(jwtPayload);
    const refreshToken = JWTUtil.signRefresh({ sub: user._id });

    // 4. Sanitized public user object (never return password_hash)
    const { password_hash, ...publicUser } = user;

    return { accessToken, refreshToken, user: publicUser };
  }

  // ── POST /auth/logout ──────────────────────────────────────────
  /**
   * Logout is stateless — the refresh cookie is cleared by the controller.
   * This hook is the right place to add a JTI denylist (Redis) later.
   */
  static async logout(userId) {
    // No-op for now. Add Redis JTI denylist here when needed:
    // await redis.set(`bl:${jti}`, '1', 'EX', remainingTtl);
    return;
  }

  static async requestPasswordReset(email) {
    if (!email || typeof email !== 'string') {
      return { ok: true };
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await UserModel.findOne({ email: normalizedEmail }).lean();
    if (!user) {
      return { ok: true, skipped: true };
    }

    await PasswordResetTokenModel.deleteMany({ user_id: user._id });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await PasswordResetTokenModel.create({
      user_id: user._id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl.replace(/\/$/, '')}/reset-password?token=${rawToken}`;
    await sendPasswordResetEmail({ to: user.email, resetUrl });

    return { ok: true, resetUrl };
  }

  static async resetPassword(token, newPassword) {
    if (!token || !newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      const err = new Error('A valid token and a new password of at least 8 characters are required.');
      err.code = 'VALIDATION_ERROR';
      err.status = 400;
      throw err;
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const resetTokenRecord = await PasswordResetTokenModel.findOne({ token_hash: tokenHash }).lean();
    if (!resetTokenRecord || resetTokenRecord.used_at || new Date(resetTokenRecord.expires_at) < new Date()) {
      const err = new Error('Reset token is invalid or expired.');
      err.code = 'INVALID_RESET_TOKEN';
      err.status = 400;
      throw err;
    }

    const passwordHash = await bcrypt.hash(newPassword, AppKeys.BCRYPT_ROUNDS);
    const user = await UserModel.findByIdAndUpdate(
      resetTokenRecord.user_id,
      {
        password_hash: passwordHash,
        password_changed_at: new Date(),
      },
      { new: true }
    );

    if (!user) {
      const err = new Error('User not found.');
      err.code = 'USER_NOT_FOUND';
      err.status = 404;
      throw err;
    }

    await PasswordResetTokenModel.deleteMany({ user_id: resetTokenRecord.user_id });

    return { ok: true, message: 'Password updated successfully. Please log in again.' };
  }

  // ── POST /auth/otp/send ────────────────────────────────────────
  static async sendOtp(identifier) {
    throw new Error('Not implemented');
  }

  // ── POST /auth/otp/verify ──────────────────────────────────────
  static async verifyOtp(identifier, code) {
    throw new Error('Not implemented');
  }
}

module.exports = AuthHelper;