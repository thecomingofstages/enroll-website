const UserModel = require('../models/User.model');

class AuthHelper {
  /** POST /auth/register */
  static async register(payload) {
    // TODO: validate uniqueness, bcrypt hash, insert User, return sanitized doc
    throw new Error('Not implemented');
  }

  /** POST /auth/login */
  static async login(email, password) {
    // TODO: find user, bcrypt.compare, sign access + refresh JWT, return tokens
    throw new Error('Not implemented');
  }

  /** POST /auth/logout */
  static async logout(userId) {
    // TODO: optional JTI denylist; cookie cleared in controller
    throw new Error('Not implemented');
  }

  /** POST /auth/otp/send */
  static async sendOtp(identifier) {
    // TODO: generate 6-digit OTP, hash, store with 5-min TTL, dispatch SMS/email
    throw new Error('Not implemented');
  }

  /** POST /auth/otp/verify */
  static async verifyOtp(identifier, code) {
    // TODO: fetch stored hash, compare, delete record, return short-lived OTP JWT
    throw new Error('Not implemented');
  }
}

module.exports = AuthHelper;
