const UserModel = require('../models/User.model');
const RegistrationModel = require('../models/Registration.model');
const ActivityModel = require('../models/Activity.model');
const QRUtil = require('../utils/QR.util');
const AppKeys = require('../config/app.keys');

class UserHelper {
  /** GET /users/me */
  static async getMe(userId) {
    const user = await UserModel.findById(userId).lean();
    if (!user) {
      const err = new Error('User not found.');
      err.code = 'NOT_FOUND';
      err.status = 404;
      throw err;
    }
    const { password_hash: _, ...sanitized } = user;
    return sanitized;
  }

  /** PATCH /users/me */
  static async updateMe(userId, payload) {
    const ALLOWED = ['first_name', 'last_name', 'nickname', 'interests', 'profile_image_url', 'address', 'education_level', 'institution'];

    const update = {};
    for (const key of ALLOWED) {
      if (payload[key] !== undefined) update[key] = payload[key];
    }

    if (Object.keys(update).length === 0) {
      const err = new Error('No valid fields to update.');
      err.code = 'VALIDATION_ERROR';
      err.status = 400;
      throw err;
    }

    const updated = await UserModel.findByIdAndUpdate(
      userId,
      { $set: update },
      { new: true, lean: true }
    );

    if (!updated) {
      const err = new Error('User not found.');
      err.code = 'NOT_FOUND';
      err.status = 404;
      throw err;
    }

    const { password_hash: _, ...sanitized } = updated;
    return sanitized;
  }

  /** GET /users/me/activities */
  static async getMyActivities(userId, filters) {
    const query = { user_id: userId };
    if (filters.reg_status) query.status = filters.reg_status;

    const registrations = await RegistrationModel.find(query).lean();

    const now = new Date();

    const enriched = await Promise.all(
      registrations.map(async (reg) => {
        const activity = await ActivityModel.findById(reg.activity_id)
          .select('_id name hero_image_url schedule price')
          .lean();

        return { registration: reg, activity };
      })
    );

    // filter upcoming/past ถ้ามี ?status=
    let result = enriched;
    if (filters.status === 'upcoming') {
      result = enriched.filter(({ activity }) =>
        activity?.schedule?.some((s) => new Date(s.date) >= now)
      );
    } else if (filters.status === 'past') {
      result = enriched.filter(({ activity }) =>
        activity?.schedule?.every((s) => new Date(s.date) < now)
      );
    }

    return result.map(({ registration, activity }) => ({
      registration_id: registration?._id,
      status: registration?.status,
      registered_at: registration?.registered_at,
      group_name: registration?.group_name,
      activity,
    }));
  }

  /** GET /users/me/qr */
  static async getQrToken(userId) {
    const qr_token = QRUtil.sign(userId);
    const expires_in = AppKeys.QR_TTL_SECONDS;
    const expires_at = new Date((Math.floor(Date.now() / 1000) + expires_in) * 1000).toISOString();
    return { qr_token, expires_at, expires_in };
  }
}

module.exports = UserHelper;