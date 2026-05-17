const UserModel         = require('../models/User.model');
const RegistrationModel = require('../models/Registration.model');
const QRUtil            = require('../utils/QR.util');
const AppKeys           = require('../config/app.keys');

class UserHelper {
  /** GET /users/me */
  static async getMe(userId) {
    // TODO: find by _id, strip password_hash, return doc
    throw new Error('Not implemented');
  }

  /** PATCH /users/me */
  static async updateMe(userId, payload) {
    // TODO: whitelist fields, $set, return updated doc
    throw new Error('Not implemented');
  }

  /** GET /users/me/activities */
  static async getMyActivities(userId, filters) {
    // TODO: query REGISTRATIONS by user_id, join activity, filter upcoming/past/status
    throw new Error('Not implemented');
  }

  /** GET /users/me/qr */
  static async getQrToken(userId) {
    // TODO: QRUtil.sign(userId), return { qr_token, expires_at, expires_in }
    throw new Error('Not implemented');
  }
}

module.exports = UserHelper;
