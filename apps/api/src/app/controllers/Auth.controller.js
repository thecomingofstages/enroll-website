const AuthHelper = require('../helpers/Auth.helper');
const Logger     = require('../utils/Logger.util');
const AppKeys    = require('../config/app.keys');

class AuthController {
  /** POST /auth/register */
  static async register(req, res, next) {
    try {
      const result = await AuthHelper.register(req.body);
      return res.status(201).json({ success: true, data: result });
    } catch (err) {
      Logger.error(`[AuthController.register] ${err.message}`);
      next(err);
    }
  }

  /** POST /auth/login */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const { accessToken, refreshToken, user } = await AuthHelper.login(email, password);

      res.cookie(AppKeys.COOKIE_NAME, refreshToken, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge:   7 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        success: true,
        data: { access_token: accessToken, token_type: 'Bearer', expires_in: 900, user },
      });
    } catch (err) {
      Logger.error(`[AuthController.login] ${err.message}`);
      next(err);
    }
  }

  /** POST /auth/logout */
  static async logout(req, res, next) {
    try {
      await AuthHelper.logout(req.user._id);
      res.clearCookie(AppKeys.COOKIE_NAME);
      return res.status(204).send();
    } catch (err) {
      Logger.error(`[AuthController.logout] ${err.message}`);
      next(err);
    }
  }

  /** POST /auth/forgot-password */
  static async forgotPassword(req, res, next) {
    try {
      await AuthHelper.requestPasswordReset(req.body.email);
      return res.status(200).json({
        success: true,
        data: { message: 'If an account exists, a reset link has been sent.' },
      });
    } catch (err) {
      Logger.error(`[AuthController.forgotPassword] ${err.message}`);
      next(err);
    }
  }

  /** POST /auth/reset-password */
  static async resetPassword(req, res, next) {
    try {
      const result = await AuthHelper.resetPassword(req.body.token, req.body.newPassword);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      Logger.error(`[AuthController.resetPassword] ${err.message}`);
      next(err);
    }
  }

  /** POST /auth/otp/send */
  static async sendOtp(req, res, next) {
    try {
      await AuthHelper.sendOtp(req.body.phone || req.body.email);
      return res.status(200).json({ success: true, data: { expires_in: 300 } });
    } catch (err) {
      Logger.error(`[AuthController.sendOtp] ${err.message}`);
      next(err);
    }
  }

  /** POST /auth/otp/verify */
  static async verifyOtp(req, res, next) {
    try {
      const { phone, email, code } = req.body;
      const result = await AuthHelper.verifyOtp(phone || email, code);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      Logger.error(`[AuthController.verifyOtp] ${err.message}`);
      next(err);
    }
  }
}

module.exports = AuthController;
