const { v7: uuidv7 }    = require('uuid');
const ActivityModel     = require('../models/Activity.model');
const RegistrationModel = require('../models/Registration.model');
const AttendanceModel   = require('../models/Attendance.model');

// Fields client must never set directly
const BLOCKED_ON_CREATE = ['enrolled_count', 'deleted_at'];
const BLOCKED_ON_UPDATE = ['enrolled_count', 'deleted_at', '_id', 'created_at'];

// Whitelist for PATCH
const UPDATABLE_FIELDS = [
  'name', 'description', 'hero_image_url',
  'price', 'seat_capacity',
  'tags', 'benefits',
  'open_registration_at', 'close_registration_at', 'registration_open_override',
  'is_featured',
  'schedule', 'extra_questions',
];

/**
 * Compute is_registration_open from the activity document fields.
 * Mirrors the virtual in the model — used when we have a plain lean() object.
 */
function computeIsOpen(activity) {
  if (activity.registration_open_override !== null && activity.registration_open_override !== undefined) {
    return activity.registration_open_override;
  }
  const now         = new Date();
  const afterOpen   = !activity.open_registration_at  || now >= new Date(activity.open_registration_at);
  const beforeClose = !activity.close_registration_at || now <= new Date(activity.close_registration_at);
  return afterOpen && beforeClose;
}

class ActivityHelper {

  // ── GET /activities ──────────────────────────────────────────────
  static async list(filters, pagination) {
    // TODO: build $match, paginate
    throw new Error('Not implemented');
  }

  // ── GET /activities/recommended ─────────────────────────────────
  static async getRecommended(userInterests, limit) {
    // TODO: interest tag match, score, sort
    throw new Error('Not implemented');
  }

  // ── GET /activities/:id ─────────────────────────────────────────
  static async getById(activityId) {
    // TODO: findById, join speakers + attendance
    throw new Error('Not implemented');
  }

  // ── POST /admin/activities ───────────────────────────────────────
  static async create(payload) {
    // 1. Strip blocked fields
    const clean = { ...payload };
    BLOCKED_ON_CREATE.forEach(f => delete clean[f]);

    // 2. hero_image_url is required — must be a non-empty string
    if (!clean.hero_image_url || typeof clean.hero_image_url !== 'string' || !clean.hero_image_url.trim()) {
      const err = new Error('hero_image_url is required (Google Drive or public image link).');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      err.field = 'hero_image_url';
      throw err;
    }

    // 3. Auto-generate question_id for any extra_question missing one
    if (Array.isArray(clean.extra_questions)) {
      clean.extra_questions = clean.extra_questions.map(q => ({
        ...q,
        question_id: q.question_id || `q_${uuidv7()}`,
      }));
    }

    // 4. Force enrolled_count = 0
    clean.enrolled_count = 0;

    // 5. Insert activity
    const activity = await ActivityModel.create(clean);

    // 6. Create paired Attendance doc (empty map — scan adds date keys)
    await AttendanceModel.create({ activity_id: activity._id });

    const obj = activity.toObject();
    obj.is_registration_open = computeIsOpen(obj);
    return obj;
  }

  // ── PATCH /admin/activities/:id ──────────────────────────────────
  /**
   * Partial update. All image URLs are plain strings (Google Drive links).
   * To open/close registration:
   *   - Set open_registration_at / close_registration_at for a date-window
   *   - Or set registration_open_override: true/false for a hard toggle
   *   - Set registration_open_override: null to go back to date-window behaviour
   */
  static async update(activityId, payload) {
    const $set = {};
    UPDATABLE_FIELDS.forEach(field => {
      if (payload[field] !== undefined) $set[field] = payload[field];
    });

    if (Object.keys($set).length === 0) {
      const err = new Error('No valid fields provided for update.');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    const updated = await ActivityModel.findByIdAndUpdate(
      activityId,
      { $set },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      const err = new Error('Activity not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    updated.is_registration_open = computeIsOpen(updated);
    return updated;
  }

  // ── DELETE /admin/activities/:id ─────────────────────────────────
  static async remove(activityId) {
    const activity = await ActivityModel.findOne({
      _id: activityId,
      deleted_at: { $exists: false },
    }).lean();

    if (!activity) {
      const err = new Error('Activity not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    const activeCount = await RegistrationModel.countDocuments({
      activity_id: activityId,
      status: { $in: ['PAID', 'JOINED'] },
    });

    if (activeCount > 0) {
      const err = new Error(
        `Cannot delete: ${activeCount} active registration(s) (PAID or JOINED) exist.`
      );
      err.statusCode = 409;
      err.code = 'HAS_ACTIVE_REGISTRATIONS';
      throw err;
    }

    await RegistrationModel.updateMany(
      { activity_id: activityId, status: 'PENDING' },
      { $set: { status: 'CANCELLED' } }
    );

    await ActivityModel.findByIdAndUpdate(activityId, {
      $set: { deleted_at: new Date() },
    });
  }
}

module.exports = ActivityHelper;
