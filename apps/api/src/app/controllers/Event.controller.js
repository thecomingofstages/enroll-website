const EventHelper = require('../helpers/Event.helper');
const Logger      = require('../utils/Logger.util');

class EventController {
  /** POST /events/scan */
  static async scan(req, res, next) {
    try {
      const { qr_token, event_id, group_name } = req.body;
      const data = await EventHelper.scan(qr_token, event_id, group_name);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      Logger.error(`[EventController.scan] ${err.message}`);
      next(err);
    }
  }

  /** POST /admin/activities/:id/export */
  static async exportToSheets(req, res, next) {
    try {
      const data = await EventHelper.exportToSheets(req.params.id);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      Logger.error(`[EventController.exportToSheets] ${err.message}`);
      next(err);
    }
  }
}

module.exports = EventController;
