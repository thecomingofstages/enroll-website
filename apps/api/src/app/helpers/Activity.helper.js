const { v7: uuidv7 }    = require('uuid');
const ActivityModel     = require('../models/Activity.model');
const SpeakerModel      = require('../models/Speaker.model');
const RegistrationModel = require('../models/Registration.model');
const AttendanceModel   = require('../models/Attendance.model');

// Fields an admin is NOT allowed to set directly via create/update
const BLOCKED_ON_CREATE = ['enrolled_count', 'deleted_at'];
const BLOCKED_ON_UPDATE = ['enrolled_count', 'deleted_at', '_id', 'created_at'];

// Fields allowed on update (whitelist — anything not here is silently dropped)
const UPDATABLE_FIELDS = [
  'name', 'description', 'hero_image_url', 'price', 'seat_capacity',
  'tags', 'benefits', 'is_registration_open', 'is_featured',
  'schedule', 'extra_questions',
];

class ActivityHelper {

  // ── GET /activities ─────────────────────────────────────────────
  static async list(filters, pagination) {
    // TODO: build $match from tags/$in, is_featured, is_registration_open; paginate
    throw new Error('Not implemented');
  }

  // ── GET /activities/recommended ─────────────────────────────────
  static async getRecommended(userInterests, limit) {
    // TODO: $in tags, score by overlap, sort desc, fallback to featured
    throw new Error('Not implemented');
  }

  // ── GET /activities/:id ─────────────────────────────────────────
  static async getById(activityId) {
    // TODO: findById, join speakers, join attendance, return full doc
    throw new Error('Not implemented');
  }

  // ── POST /admin/activities ──────────────────────────────────────
  /**
   * Create a new activity and its paired Attendance document.
   * - Strips any client-supplied blocked fields (enrolled_count, deleted_at)
   * - Auto-generates question_id for each extra_question that omits one
   * - Atomically creates Activity + Attendance in sequence
   *   (Attendance doc is born empty — date keys are added by POST /events/scan)
   * - Returns the saved activity document
   */
  static async create(payload) {
    // 1. Strip blocked fields
    const clean = { ...payload };
    BLOCKED_ON_CREATE.forEach(f => delete clean[f]);

    // 2. Auto-generate question_id for any extra_question missing one
    if (Array.isArray(clean.extra_questions)) {
      clean.extra_questions = clean.extra_questions.map(q => ({
        ...q,
        question_id: q.question_id || `q_${uuidv7()}`,
      }));
    }

    // 3. enrolled_count always starts at 0
    clean.enrolled_count = 0;

    // 4. Insert activity — Mongoose assigns UUIDv7 _id via schema default
    const activity = await ActivityModel.create(clean);

    // 5. Create paired Attendance doc (empty — scan will add date keys)
    await AttendanceModel.create({ activity_id: activity._id });

    return activity.toObject();
  }

  // ── PATCH /admin/activities/:id ─────────────────────────────────
  /**
   * Partial update of an activity.
   * - Only UPDATABLE_FIELDS are applied; everything else is silently ignored
   * - enrolled_count can never be set here — use the payment pipeline
   * - Returns the updated document (or throws 404 if not found)
   */
  static async update(activityId, payload) {
    // 1. Build a safe $set from whitelisted fields only
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

    // 2. findByIdAndUpdate — returns null if not found
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

    return updated;
  }

  // ── DELETE /admin/activities/:id ────────────────────────────────
  /**
   * Soft-delete an activity.
   * Rules:
   *  - Throws 404 if the activity does not exist (or already deleted)
   *  - Throws 409 if any PAID or JOINED registrations exist
   *  - Cancels all PENDING registrations before deleting
   *  - Soft-deletes by setting deleted_at timestamp (never hard-deletes)
   */
  static async remove(activityId) {
    // 1. Find the activity — exclude already-deleted ones
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

    // 2. Block deletion if PAID/JOINED registrations exist
    const activeCount = await RegistrationModel.countDocuments({
      activity_id: activityId,
      status: { $in: ['PAID', 'JOINED'] },
    });

    if (activeCount > 0) {
      const err = new Error(
        `Cannot delete: ${activeCount} active registration(s) (PAID or JOINED) exist for this activity.`
      );
      err.statusCode = 409;
      err.code = 'HAS_ACTIVE_REGISTRATIONS';
      throw err;
    }

    // 3. Cancel all PENDING registrations
    await RegistrationModel.updateMany(
      { activity_id: activityId, status: 'PENDING' },
      { $set: { status: 'CANCELLED' } }
    );

    // 4. Soft-delete
    await ActivityModel.findByIdAndUpdate(activityId, {
      $set: { deleted_at: new Date() },
    });
  }
}

module.exports = ActivityHelper;
