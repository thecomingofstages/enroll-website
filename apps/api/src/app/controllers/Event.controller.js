const EventHelper = require('../helpers/Event.helper');
const Logger      = require('../utils/Logger.util');

class EventController {
  /** POST /events/scan */
  static async scan(req, res, next) {
    try {
      const { qr_token, event_id } = req.body;
      const data = await EventHelper.scan(qr_token, event_id);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      Logger.error(`[EventController.scan] ${err.message}`);
      next(err);
    }
  }

  /** POST /admin/activities/:id/export — streams .xlsx file as download */
  static async exportActivity(req, res, next) {
    try {
      const { buffer, filename } = await EventHelper.exportActivity(req.params.id);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);
      return res.status(200).end(buffer);
    } catch (err) {
      Logger.error(`[EventController.exportActivity] ${err.message}`);
      next(err);
    }
  }
}

module.exports = EventController;
