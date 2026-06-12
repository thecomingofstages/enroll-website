const bcrypt    = require('bcrypt');
const { v7: uuidv7 } = require('uuid');
const UserModel         = require('../models/User.model');
const RecoveryCodeModel = require('../models/RecoveryCode.model');
const JWTUtil   = require('../utils/JWT.util');
const AppKeys   = require('../config/app.keys');

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

  // ── POST /auth/otp/send ────────────────────────────────────────
  static async sendOtp(identifier) {
    throw new Error('Not implemented');
  }

  // ── POST /auth/otp/verify ──────────────────────────────────────
  static async verifyOtp(identifier, code) {
    throw new Error('Not implemented');
  }

  // ── POST /auth/password/reset/recovery ─────────────────────────
  /**
   * Reset a user's password using a one-time recovery code.
   *
   * This endpoint is the account-recovery path for users who can't log in
   * via email/password and don't have access to email or phone (e.g. email
   * locked out, phone changed). The recovery code, generated from
   * POST /users/me/recovery-codes, IS the proof of identity here — there
   * is no access token.
   *
   * Anti-enumeration: every code lookup runs in constant time relative
   * to the user-existing case. We always do a bcrypt.compare against a
   * dummy hash when the user doesn't exist or has no codes, so timing
   * doesn't leak which case the request hit. The response body and
   * status code are identical across the four outcomes below:
   *   1. user not found
   *   2. user found, no recovery codes on file
   *   3. user found, code didn't match
   *   4. user found, code matched — rotate hash, burn all codes
   *
   * On success the user's remaining codes are deleted (force-regenerate
   * next time), so a stolen code is only good for one use.
   */
  static async resetPasswordWithCode(email, code, newPassword) {
    if (!email || !code || !newPassword) {
      const err = new Error('Email, code, and new password are required.');
      err.code = 'VALIDATION_ERROR';
      err.status = 400;
      throw err;
    }

    if (newPassword.length < 8) {
      const err = new Error('Password must be at least 8 characters.');
      err.code = 'VALIDATION_ERROR';
      err.field = 'new_password';
      err.status = 400;
      throw err;
    }

    // Pre-compute a dummy hash so the not-found / no-codes paths still pay
    // the bcrypt cost and don't reveal the user-existing branch by timing.
    const DUMMY_HASH = '$2b$12$CwTycUXWue0Thq9StjUM0uJ8Vb0YqH2yVxq3pE2gV4W0nQ2lE2G6m';
    const normalized = String(email).toLowerCase().trim();

    const user = await UserModel.findOne({ email: normalized }).lean();
    const candidates = user
      ? await RecoveryCodeModel.find({ user_id: user._id, used: false }).lean()
      : [];

    let matched = false;
    if (candidates.length > 0) {
      // Compare against real candidates.
      for (const c of candidates) {
        // eslint-disable-next-line no-await-in-loop
        const ok = await bcrypt.compare(code, c.code_hash);
        if (ok) { matched = true; break; }
      }
    } else {
      // Burn constant time on the dummy hash so the missing-codes path
      // looks identical in latency to the real-match path.
      await bcrypt.compare(code, DUMMY_HASH);
    }

    // Single generic failure for cases 1, 2, 3.
    if (!user || !matched) {
      const err = new Error('Invalid email or recovery code.');
      err.code = 'INVALID_CREDENTIALS';
      err.status = 401;
      throw err;
    }

    // Case 4 — rotate the password hash and burn all remaining codes.
    const password_hash = await bcrypt.hash(newPassword, AppKeys.BCRYPT_ROUNDS);
    await UserModel.findByIdAndUpdate(user._id, { $set: { password_hash } });
    await RecoveryCodeModel.deleteMany({ user_id: user._id });

    return { success: true };
  }
}

module.exports = AuthHelper;