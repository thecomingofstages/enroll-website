const { v7: uuidv7 }    = require('uuid');
const ActivityModel     = require('../models/Activity.model');
const RegistrationModel = require('../models/Registration.model');
const AttendanceModel   = require('../models/Attendance.model');
const R2Util            = require('../utils/R2.util');

// Fields an admin is NOT allowed to set directly via create/update
const BLOCKED_ON_CREATE = ['enrolled_count', 'deleted_at', 'hero_image_url'];
const BLOCKED_ON_UPDATE = ['enrolled_count', 'deleted_at', '_id', 'created_at', 'hero_image_url'];

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
    const SpeakerModel = require('../models/Speaker.model');

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

    // Compute is_registration_open from date range + override
    if (activity.is_registration_open === undefined || activity.is_registration_open === null) {
      const now = new Date();
      const openAt  = activity.open_registration_at  ? new Date(activity.open_registration_at)  : null;
      const closeAt = activity.close_registration_at ? new Date(activity.close_registration_at) : null;

      if (activity.registration_open_override === true) {
        // Admin override — force open if within date range (or no range set)
        const afterOpen  = !openAt  || now >= openAt;
        const beforeClose = !closeAt || now <= closeAt;
        activity.is_registration_open = afterOpen && beforeClose;
      } else if (activity.registration_open_override === false) {
        // Admin explicitly closed
        activity.is_registration_open = false;
      } else {
        // No override — use date range
        const afterOpen  = !openAt  || now >= openAt;
        const beforeClose = !closeAt || now <= closeAt;
        activity.is_registration_open = afterOpen && beforeClose;
      }
    }

    // Join speakers for this activity
    const speakers = await SpeakerModel.find({ activity_id: activityId }).lean();
    activity.speakers = speakers;

    return activity;
  }

  // ── POST /admin/activities ──────────────────────────────────────
  /**
   * Create a new activity and its paired Attendance document.
   *
   * @param {object} payload  - req.body (multipart form fields, all strings — parse as needed)
   * @param {object|null} file - req.file from multer (memoryStorage), or null if no file sent
   *
   * Flow:
   * 1. Require hero_image file (or fallback to hero_image_url in body if already a CDN link)
   * 2. Upload hero_image buffer to R2 → get back the CDN URL
   * 3. Strip blocked fields, force enrolled_count = 0, auto-gen question_ids
   * 4. Insert Activity doc
   * 5. Create paired Attendance doc (empty map — scan fills it per day)
   * 6. Return saved activity
   */
  static async create(payload, file) {
    // 1. Hero image — file takes priority over any URL in body
    let hero_image_url;

    if (file) {
      hero_image_url = await R2Util.upload(
        file.buffer,
        'activity-heroes',
        file.originalname,
        file.mimetype
      );
    } else if (payload.hero_image_url) {
      // Allow passing a pre-existing CDN URL (e.g. in tests or seeding)
      hero_image_url = payload.hero_image_url;
    } else {
      const err = new Error('hero_image file is required.');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      err.field = 'hero_image';
      throw err;
    }

    // 2. Strip blocked fields from payload
    const clean = { ...payload };
    BLOCKED_ON_CREATE.forEach(f => delete clean[f]);

    // 3. Inject the resolved URL
    clean.hero_image_url = hero_image_url;

    // 4. Auto-generate question_id for any extra_question missing one
    if (Array.isArray(clean.extra_questions)) {
      clean.extra_questions = clean.extra_questions.map(q => ({
        ...q,
        question_id: q.question_id || `q_${uuidv7()}`,
      }));
    }

    // 5. Force enrolled_count to 0 — never trust client value
    clean.enrolled_count = 0;

    // 6. Insert activity
    const activity = await ActivityModel.create(clean);

    // 7. Create paired Attendance doc (empty — scan adds date keys)
    await AttendanceModel.create({ activity_id: activity._id });

    return activity.toObject();
  }

  // ── PATCH /admin/activities/:id ─────────────────────────────────
  /**
   * Partial update of an activity.
   *
   * @param {string}      activityId
   * @param {object}      payload  - req.body
   * @param {object|null} file     - req.file (only present when admin is changing the image)
   *
   * If a new hero_image file is sent → upload to R2 and update hero_image_url.
   * If no file → hero_image_url is unchanged (blocked from body payload).
   */
  static async update(activityId, payload, file) {
    // 1. Build safe $set from whitelisted fields only (hero_image_url blocked from body)
    const $set = {};
    UPDATABLE_FIELDS.forEach(field => {
      // hero_image_url comes from file upload only, not from body
      if (field === 'hero_image_url') return;
      if (payload[field] !== undefined) $set[field] = payload[field];
    });

    // 2. If a new image was uploaded, push to R2 and add to $set
    if (file) {
      $set.hero_image_url = await R2Util.upload(
        file.buffer,
        'activity-heroes',
        file.originalname,
        file.mimetype
      );
    }

    if (Object.keys($set).length === 0) {
      const err = new Error('No valid fields provided for update.');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    // 3. findByIdAndUpdate — returns null if not found
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
   * - Throws 404 if not found or already deleted
   * - Throws 409 if PAID/JOINED registrations exist
   * - Cancels all PENDING registrations
   * - Soft-deletes via deleted_at timestamp
   */
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
        `Cannot delete: ${activeCount} active registration(s) (PAID or JOINED) exist for this activity.`
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
