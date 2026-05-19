const bcrypt    = require('bcrypt');
const UserModel = require('../models/User.model');
const AppKeys   = require('../config/app.keys');

class AuthHelper {
  /** POST /auth/register */
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

  /** POST /auth/login */
  static async login(email, password) {
    throw new Error('Not implemented');
  }

  /** POST /auth/logout */
  static async logout(userId) {
    throw new Error('Not implemented');
  }

  /** POST /auth/otp/send */
  static async sendOtp(identifier) {
    throw new Error('Not implemented');
  }

  /** POST /auth/otp/verify */
  static async verifyOtp(identifier, code) {
    throw new Error('Not implemented');
  }
}

module.exports = AuthHelper;