const crypto       = require('node:crypto');
const bcrypt       = require('bcrypt');
const UserModel         = require('../models/User.model');
const RegistrationModel = require('../models/Registration.model');
const ActivityModel     = require('../models/Activity.model');
const RecoveryCodeModel = require('../models/RecoveryCode.model');
const QRUtil  = require('../utils/QR.util');
const AppKeys = require('../config/app.keys');

// How many codes to issue per generation, and how the plaintext looks.
// 4 groups of 5 chars from a 32-symbol alphabet ≈ 100 bits total entropy
// per code, which is well above the 80-bit floor NIST recommends.
const RECOVERY_CODE_COUNT  = 10;
const RECOVERY_CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 — readable when printed
const RECOVERY_CODE_GROUPS  = 4;
const RECOVERY_CODE_GROUP_LEN = 5;

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

  // ── POST /users/me/recovery-codes ─────────────────────────────
  /**
   * Generate a fresh set of one-time recovery codes for the user.
   * Any previous codes for this user are deleted — a set is single-use:
   * generating a new set invalidates all earlier ones.
   *
   * Returns the plaintext codes for the client to display once. The server
   * stores only bcrypt hashes. If the user loses these they must log in
   * (or use another recovery path) to generate a new set.
   */
  static async generateRecoveryCodes(userId) {
    // Wipe any existing codes for this user before issuing new ones.
    // This matches the "consume a code regenerates the set" pattern.
    await RecoveryCodeModel.deleteMany({ user_id: userId });

    const codes = [];
    const docs  = [];
    for (let i = 0; i < RECOVERY_CODE_COUNT; i++) {
      const plaintext = UserHelper._mintRecoveryCode();
      const code_hash = await bcrypt.hash(plaintext, AppKeys.BCRYPT_ROUNDS);
      codes.push(plaintext);
      docs.push({ user_id: userId, code_hash });
    }

    if (docs.length > 0) {
      await RecoveryCodeModel.insertMany(docs);
    }

    return { codes, remaining: codes.length };
  }

  // ── GET /users/me/recovery-codes/count ────────────────────────
  /** How many unused recovery codes the user has left. */
  static async countRecoveryCodes(userId) {
    const remaining = await RecoveryCodeModel.countDocuments({
      user_id: userId,
      used:    false,
    });
    return { remaining };
  }

  // ── internal ──────────────────────────────────────────────────
  /** Build a single human-readable recovery code (e.g. "ABCDE-FGHJK-LMNOP-QRSTU"). */
  static _mintRecoveryCode() {
    const groups = [];
    const bytes  = crypto.randomBytes(RECOVERY_CODE_GROUPS * RECOVERY_CODE_GROUP_LEN);
    let cursor   = 0;
    for (let g = 0; g < RECOVERY_CODE_GROUPS; g++) {
      let group = '';
      for (let i = 0; i < RECOVERY_CODE_GROUP_LEN; i++) {
        group += RECOVERY_CODE_CHARSET[bytes[cursor++] % RECOVERY_CODE_CHARSET.length];
      }
      groups.push(group);
    }
    return groups.join('-');
  }
}

module.exports = UserHelper;