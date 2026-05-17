const RegistrationModel = require('../models/Registration.model');
const ActivityModel     = require('../models/Activity.model');
const QRUtil            = require('../utils/QR.util');

class EventHelper {
  /**
   * POST /events/scan
   * Verifies participant QR token against a specific event.
   */
  static async scan(qrToken, eventId, groupName) {
    // TODO:
    // 1. QRUtil.verify(qrToken) — throws INVALID_QR / QR_EXPIRED on failure
    // 2. Extract user_id from decoded payload
    // 3. Find REGISTRATION where user_id + activity_id === eventId
    //    — throw NOT_ENROLLED (404) if none found
    // 4. Confirm status === PAID — throw ALREADY_JOINED (422) if JOINED, error if PENDING
    // 5. Atomic $set status → JOINED, set group_name if provided
    // 6. Return user info + group_name + activity_name for scanner display
    throw new Error('Not implemented');
  }

  /**
   * POST /admin/activities/:id/export
   * Hybrid ETL pipeline → Google Sheets.
   */
  static async exportToSheets(activityId) {
    // TODO:
    // EXTRACT: query REGISTRATIONS (PAID + JOINED) for activity, join USERS
    // TRANSFORM: flatten custom_answers by question_id → columns
    // LOAD: Google Sheets API (service account), batchUpdate header + rows
    // Queue via BullMQ if > 500 rows
    throw new Error('Not implemented');
  }
}

module.exports = EventHelper;
