const ActivityHelper = require('../helpers/Activity.helper');
const Logger         = require('../utils/Logger.util');

class ActivityController {
  static async list(req, res, next) {
    try {
      const filters    = { tags: req.query.tags, is_featured: req.query.is_featured };
      const pagination = { page: parseInt(req.query.page) || 1, limit: parseInt(req.query.limit) || 20 };
      const data       = await ActivityHelper.list(filters, pagination);
      return res.status(200).json({ success: true, ...data });
    } catch (err) { Logger.error(`[ActivityController.list] ${err.message}`); next(err); }
  }

  static async getRecommended(req, res, next) {
    try {
      const data = await ActivityHelper.getRecommended(req.user.interests, parseInt(req.query.limit) || 10);
      return res.status(200).json({ success: true, data });
    } catch (err) { Logger.error(`[ActivityController.getRecommended] ${err.message}`); next(err); }
  }

  static async getById(req, res, next) {
    try {
      const data = await ActivityHelper.getById(req.params.id);
      return res.status(200).json({ success: true, data });
    } catch (err) { Logger.error(`[ActivityController.getById] ${err.message}`); next(err); }
  }

  /** POST /admin/activities — JSON body*/
  static async create(req, res, next) {
    try {
      const data = await ActivityHelper.create(req.body);
      return res.status(201).json({ success: true, data });
    } catch (err) { Logger.error(`[ActivityController.create] ${err.message}`); next(err); }
  }

  /** PATCH /admin/activities/:id — JSON body */
  static async update(req, res, next) {
    try {
      const data = await ActivityHelper.update(req.params.id, req.body);
      return res.status(200).json({ success: true, data });
    } catch (err) { Logger.error(`[ActivityController.update] ${err.message}`); next(err); }
  }

  static async remove(req, res, next) {
    try {
      await ActivityHelper.remove(req.params.id);
      return res.status(204).send();
    } catch (err) { Logger.error(`[ActivityController.remove] ${err.message}`); next(err); }
  }
}

module.exports = ActivityController;
