const UserHelper = require('../helpers/User.helper');
const Logger     = require('../utils/Logger.util');

class UserController {
  /** GET /users/me */
  static async getMe(req, res, next) {
    try {
      const data = await UserHelper.getMe(req.user._id);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      Logger.error(`[UserController.getMe] ${err.message}`);
      next(err);
    }
  }

  /** PATCH /users/me */
  static async updateMe(req, res, next) {
    try {
      const data = await UserHelper.updateMe(req.user._id, req.body);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      Logger.error(`[UserController.updateMe] ${err.message}`);
      next(err);
    }
  }

  /** GET /users/me/activities */
  static async getMyActivities(req, res, next) {
    try {
      const filters = { status: req.query.status, reg_status: req.query.reg_status };
      const data    = await UserHelper.getMyActivities(req.user._id, filters);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      Logger.error(`[UserController.getMyActivities] ${err.message}`);
      next(err);
    }
  }

  /** GET /users/me/qr */
  static async getQrToken(req, res, next) {
    try {
      const data = await UserHelper.getQrToken(req.user._id);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      Logger.error(`[UserController.getQrToken] ${err.message}`);
      next(err);
    }
  }

  /** POST /users/me/recovery-codes */
  static async generateRecoveryCodes(req, res, next) {
    try {
      const data = await UserHelper.generateRecoveryCodes(req.user._id);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      Logger.error(`[UserController.generateRecoveryCodes] ${err.message}`);
      next(err);
    }
  }

  /** GET /users/me/recovery-codes/count */
  static async countRecoveryCodes(req, res, next) {
    try {
      const data = await UserHelper.countRecoveryCodes(req.user._id);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      Logger.error(`[UserController.countRecoveryCodes] ${err.message}`);
      next(err);
    }
  }
}

module.exports = UserController;
