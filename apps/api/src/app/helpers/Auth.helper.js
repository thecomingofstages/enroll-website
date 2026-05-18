const bcrypt    = require('bcrypt');
const { v7: uuidv7 } = require('uuid');
const UserModel = require('../models/User.model');
const JWTUtil   = require('../utils/JWT.util');
const AppKeys   = require('../config/app.keys');

class AuthHelper {

  // ── POST /auth/register ────────────────────────────────────────
  static async register(payload) {
    // TODO: validate uniqueness, bcrypt hash, insert User, return sanitized doc
    throw new Error('Not implemented');
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
    // TODO: generate 6-digit OTP, hash, store with 5-min TTL, dispatch SMS/email
    throw new Error('Not implemented');
  }

  // ── POST /auth/otp/verify ──────────────────────────────────────
  static async verifyOtp(identifier, code) {
    // TODO: fetch stored hash, compare, delete record, return short-lived OTP JWT
    throw new Error('Not implemented');
  }
}

module.exports = AuthHelper;
