const RegistrationModel = require('../models/Registration.model');
const ActivityModel     = require('../models/Activity.model');
const UserModel         = require('../models/User.model');

class RegistrationHelper {
  /**
   * POST /registrations
   * Handles both existing-user (userId provided) and new-user (newUserPayload provided) cases.
   */
  static async create(userId, activityId, customAnswers, newUserPayload) {
    // TODO:
    // CASE A (existing user): userId present
    // CASE B (new user): call AuthHelper.register(newUserPayload), use returned _id as userId
    // - Validate activity exists + is_registration_open
    // - Check seat_capacity vs enrolled_count
    // - Check duplicate registration
    // - Validate customAnswers against extra_questions
    // - Insert REGISTRATION (status: PENDING)
    // - If price === 0: set status PAID, $inc enrolled_count immediately
    // - Return { registration, access_token? }
    throw new Error('Not implemented');
  }

  /** GET /registrations/:id */
  static async getById(registrationId, requestingUser) {
    // TODO: find by _id, verify owner or admin, join activity snapshot, return doc
    throw new Error('Not implemented');
  }

  /** GET /admin/registrations */
  static async adminList(filters, pagination) {
    // TODO: filter by activity_id / status, join user + activity, paginate
    throw new Error('Not implemented');
  }

  /** PATCH /admin/registrations/:id/status */
  static async adminUpdateStatus(registrationId, status, groupName) {
    // TODO: validate status transition, $set, if PENDING→PAID $inc enrolled_count
    throw new Error('Not implemented');
  }
}

module.exports = RegistrationHelper;
