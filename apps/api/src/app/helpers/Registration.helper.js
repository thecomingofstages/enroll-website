const RegistrationModel = require('../models/Registration.model');
const ActivityModel     = require('../models/Activity.model');
const AuthHelper        = require('./Auth.helper');
const JWTUtil           = require('../utils/JWT.util');

// Valid status transitions for adminUpdateStatus
const VALID_TRANSITIONS = {
  PENDING:   ['PAID', 'CANCELLED'],
  PAID:      ['JOINED', 'CANCELLED'],
  JOINED:    [],
  CANCELLED: [],
};

class RegistrationHelper {

  // ── POST /registrations ─────────────────────────────────────────
  /**
   * Initiate a registration.
   *
   * CASE A — Existing user: userId is present (resolved from Bearer JWT in controller).
   * CASE B — New user: userId is null, newUserPayload contains account details.
   *          Account is created atomically before registration proceeds.
   *
   * Returns { registration, activity, access_token? }
   * access_token is only present in CASE B — new user gets logged in immediately.
   */
  static async create(userId, activityId, customAnswers = [], newUserPayload = null) {
    // ── 1. Resolve user ───────────────────────────────────────────
    let accessToken = null;

    if (!userId) {
      // CASE B — must provide new_user block
      if (!newUserPayload) {
        const err = new Error('Provide a Bearer token (existing user) or a new_user object (new user).');
        err.statusCode = 400;
        err.code = 'VALIDATION_ERROR';
        throw err;
      }

      // Delegate entirely to AuthHelper.register — it handles validation,
      // uniqueness check, bcrypt hash, and UserModel.create
      const newUser = await AuthHelper.register(newUserPayload);

      userId = newUser._id;

      // Issue access token so new user is logged in immediately
      accessToken = JWTUtil.signAccess({
        sub:      newUser._id,
        nickname: newUser.nickname,
        role:     newUser.role || 'user',
      });
    }

    // ── 2. Validate activity ──────────────────────────────────────
    if (!activityId) {
      const err = new Error('activity_id is required.');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    const activity = await ActivityModel.findById(activityId).lean();

    if (!activity) {
      const err = new Error('Activity not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (!activity.is_registration_open) {
      const err = new Error('This activity is not accepting registrations.');
      err.statusCode = 422;
      err.code = 'REGISTRATION_CLOSED';
      throw err;
    }

    // ── 3. Check seat availability ────────────────────────────────
    if (activity.enrolled_count >= activity.seat_capacity) {
      const err = new Error('This activity has reached its seat capacity.');
      err.statusCode = 422;
      err.code = 'ACTIVITY_FULL';
      throw err;
    }

    // ── 4. Check for duplicate registration ───────────────────────
    const duplicate = await RegistrationModel.findOne({
      user_id:     userId,
      activity_id: activityId,
      status:      { $nin: ['CANCELLED'] }, // cancelled = allowed to re-register
    }).lean();

    if (duplicate) {
      const err = new Error('You are already registered for this activity.');
      err.statusCode = 409;
      err.code = 'DUPLICATE_REGISTRATION';
      throw err;
    }

    // ── 5. Validate custom answers against extra_questions ────────
    const requiredQuestions = activity.extra_questions.filter(q => q.is_required);
    const answeredIds       = (customAnswers || []).map(a => a.question_id);

    const unanswered = requiredQuestions.filter(q => !answeredIds.includes(q.question_id));
    if (unanswered.length) {
      const err = new Error(
        `Missing required answers for: ${unanswered.map(q => q.question_text).join(', ')}.`
      );
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      err.field = 'custom_answers';
      throw err;
    }

    // ── 6. Create registration ────────────────────────────────────
    // Free activities (price === 0) → set PAID immediately and inc enrolled_count
    const isFree   = activity.price === 0;
    const status   = isFree ? 'PAID' : 'PENDING';

    const registration = await RegistrationModel.create({
      user_id:        userId,
      activity_id:    activityId,
      status,
      custom_answers: customAnswers || [],
    });

    if (isFree) {
      await ActivityModel.findByIdAndUpdate(activityId, { $inc: { enrolled_count: 1 } });
    }

    // ── 7. Return ─────────────────────────────────────────────────
    const result = {
      registration_id: registration._id,
      status:          registration.status,
      activity_id:     activityId,
      registered_at:   registration.registered_at,
      activity: {
        name:  activity.name,
        price: activity.price,
      },
    };

    if (accessToken) result.access_token = accessToken;

    return result;
  }

  // ── GET /registrations/:id ──────────────────────────────────────
  static async getById(registrationId, requestingUser) {
    // TODO: find by _id, verify owner or admin, join activity snapshot
    throw new Error('Not implemented');
  }

  // ── GET /admin/registrations ────────────────────────────────────
  static async adminList(filters, pagination) {
    // TODO: filter by activity_id / status, join user + activity, paginate
    throw new Error('Not implemented');
  }

  // ── PATCH /admin/registrations/:id/status ───────────────────────
  static async adminUpdateStatus(registrationId, status, groupName) {
    // TODO: validate status transition, $set, if PENDING→PAID $inc enrolled_count
    throw new Error('Not implemented');
  }
}

module.exports = RegistrationHelper;
