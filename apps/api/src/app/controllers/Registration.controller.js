const RegistrationHelper = require('../helpers/Registration.helper');
const Logger             = require('../utils/Logger.util');

class RegistrationController {
  /** POST /registrations */
  static async create(req, res, next) {
    try {
      const userId       = req.user?._id || null; // null if new-user flow
      const { activity_id, custom_answers, new_user } = req.body;
      const data = await RegistrationHelper.create(userId, activity_id, custom_answers, new_user);
      return res.status(201).json({ success: true, data });
    } catch (err) {
      Logger.error(`[RegistrationController.create] ${err.message}`);
      next(err);
    }
  }

  /** GET /registrations/:id */
  static async getById(req, res, next) {
    try {
      const data = await RegistrationHelper.getById(req.params.id, req.user);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      Logger.error(`[RegistrationController.getById] ${err.message}`);
      next(err);
    }
  }

  /** GET /admin/registrations */
  static async adminList(req, res, next) {
    try {
      const filters    = { activity_id: req.query.activity_id, status: req.query.status };
      const pagination = { page: parseInt(req.query.page) || 1, limit: parseInt(req.query.limit) || 50 };
      const data       = await RegistrationHelper.adminList(filters, pagination);
      return res.status(200).json({ success: true, ...data });
    } catch (err) {
      Logger.error(`[RegistrationController.adminList] ${err.message}`);
      next(err);
    }
  }

  /** PATCH /admin/registrations/:id/status */
  static async adminUpdateStatus(req, res, next) {
    try {
      const { status, group_name } = req.body;
      const data = await RegistrationHelper.adminUpdateStatus(req.params.id, status, group_name);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      Logger.error(`[RegistrationController.adminUpdateStatus] ${err.message}`);
      next(err);
    }
  }
}

module.exports = RegistrationController;
