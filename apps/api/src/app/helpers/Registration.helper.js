const RegistrationModel = require('../models/Registration.model');
const ActivityModel     = require('../models/Activity.model');
const AuthHelper        = require('./Auth.helper');
const JWTUtil           = require('../utils/JWT.util');

const VALID_TRANSITIONS = {
  PENDING:   ['PAID', 'CANCELLED'],
  PAID:      ['JOINED', 'CANCELLED'],
  JOINED:    [],
  CANCELLED: ['PENDING'],
};

class RegistrationHelper {

  // ── POST /registrations ──────────────────────────────────────────
  /**
   * Creates a new registration for a user.
   * 
   * Fixed order:
   *   1. Validate ALL business rules (activity open, capacity, duplicate, answers)
   *   2. Create user account (Case B only)  ← DB write only after all checks pass
   *   3. Create registration
   *
   * Payment retry note:
   *   If a user submits a wrong slip, Payment.helper sets the payment to FAILED
   *   and reverts the registration back to PENDING. The user then re-uploads a
   *   new slip via POST /registrations/:id/payment — 
   *   GET /users/me/activities (or GET /registrations/mine below)
   *   lets the frontend find the existing PENDING registration ID to reuse.
   */
  static async create(userId, activityId, customAnswers = [], newUserPayload = null) {

    // ── 0. Determine actor identity (without writing to DB yet for Case B) ──
    // For Case B we validate email uniqueness here without creating the account.
    let isNewUser = false;

    if (!userId) {
      if (!newUserPayload) {
        const err = new Error('Provide a Bearer token (existing user) or a new_user object (new user).');
        err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
      }
      // Pre-validate new_user fields before any DB writes
      const required = ['first_name', 'last_name', 'nickname', 'email', 'phone', 'password', 'gender'];
      const missing  = required.filter(f => !newUserPayload[f]);
      if (missing.length) {
        const err = new Error(`Missing required fields for new account: ${missing.join(', ')}.`);
        err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
      }
      // Check email uniqueness early — fail fast before touching anything else
      const UserModel = require('../models/User.model');
      const existingUser = await UserModel.findOne({
        email: newUserPayload.email.toLowerCase().trim(),
      }).lean();
      if (existingUser) {
        const err = new Error('An account with this email already exists. Please log in instead.');
        err.statusCode = 409; err.code = 'DUPLICATE_EMAIL'; throw err;
      }
      isNewUser = true;
      // userId stays null — we only create the account after all validation passes
    }

    // ── 1. Validate activity_id ─────────────────────────────────────
    if (!activityId) {
      const err = new Error('activity_id is required.');
      err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
    }

    const activity = await ActivityModel.findById(activityId).lean();
    if (!activity) {
      const err = new Error('Activity not found.');
      err.statusCode = 404; err.code = 'NOT_FOUND'; throw err;
    }

    // ── 2. Registration window ──────────────────────────────────────
    if (!_computeIsOpen(activity)) {
      const err = new Error('This activity is not accepting registrations.');
      err.statusCode = 422; err.code = 'REGISTRATION_CLOSED'; throw err;
    }

    // ── 3. Seat capacity ────────────────────────────────────────────
    if (activity.enrolled_count >= activity.seat_capacity) {
      const err = new Error('This activity has reached its seat capacity.');
      err.statusCode = 422; err.code = 'ACTIVITY_FULL'; throw err;
    }

    // ── 4. Duplicate registration check (for existing users only) ───
    // For new users userId is still null here — they can't have a duplicate reg.
    if (userId) {
      const duplicate = await RegistrationModel.findOne({
        user_id:     userId,
        activity_id: activityId,
        status:      { $nin: ['CANCELLED'] },
      }).lean();
      if (duplicate) {
        const err = new Error('You are already registered for this activity.');
        err.statusCode = 409; err.code = 'DUPLICATE_REGISTRATION'; throw err;
      }
    }

    // ── 5. Validate custom_answers ──────────────────────────────────
    // This check now runs BEFORE any DB write — fixing the bug where a
    // new user account was created even when answer validation would fail.
    const requiredQs  = (activity.extra_questions || []).filter(q => q.is_required);
    const answeredIds = (customAnswers || []).map(a => a.question_id);
    const unanswered  = requiredQs.filter(q => !answeredIds.includes(q.question_id));
    if (unanswered.length) {
      const err = new Error(
        `Missing required answers for: ${unanswered.map(q => q.question_text).join(', ')}.`
      );
      err.statusCode = 400; err.code = 'VALIDATION_ERROR'; err.field = 'custom_answers'; throw err;
    }

    // ── 6. All checks passed — now write to DB ──────────────────────

    let accessToken = null;

    if (isNewUser) {
      // Case B: create the user account only after all validation has passed
      const newUser  = await AuthHelper.register(newUserPayload);
      userId         = newUser._id;
      accessToken    = JWTUtil.signAccess({
        sub:      newUser._id,
        nickname: newUser.nickname,
        role:     newUser.role || 'user',
      });
    }

    const isFree = activity.price === 0;
    const status = isFree ? 'PAID' : 'PENDING';

    const registration = await RegistrationModel.create({
      user_id:        userId,
      activity_id:    activityId,
      status,
      custom_answers: customAnswers || [],
    });

    if (isFree) {
      await ActivityModel.findByIdAndUpdate(activityId, { $inc: { enrolled_count: 1 } });
    }

    const result = {
      registration_id: registration._id,
      status:          registration.status,
      activity_id:     activityId,
      registered_at:   registration.registered_at,
      activity:        { name: activity.name, price: activity.price },
    };
    if (accessToken) result.access_token = accessToken;
    return result;
  }

  // ── GET /registrations/mine ──────────────────────────────────────
  /**
   * Returns the authenticated user's own registrations.
   *
   * Useful for the frontend to:
   *   - Show in-flight PENDING registrations so the user can resume payment
   *   - Let the user find a PENDING registration ID to resubmit a slip after
   *     a failed/wrong payment (avoids needing to re-register)
   *
   * Query params:
   *   status — filter by PENDING | PAID | JOINED | CANCELLED
   */
  static async getMyRegistrations(userId, filters = {}) {
    const query = { user_id: userId };
    if (filters.status) query.status = filters.status;

    const registrations = await RegistrationModel.find(query)
      .sort({ registered_at: -1 })
      .populate('activity_id', 'name hero_image_url price schedule enrolled_count seat_capacity')
      .lean();

    return registrations;
  }

  // ── GET /registrations/:id ───────────────────────────────────────
  static async getById(registrationId, requestingUser) {
    const registration = await RegistrationModel.findById(registrationId).lean();
    if (!registration) {
      const err = new Error('Registration not found.');
      err.statusCode = 404; err.code = 'NOT_FOUND'; throw err;
    }

    if (requestingUser.role !== 'admin' && registration.user_id !== requestingUser._id.toString()) {
      const err = new Error('You can only view your own registrations.');
      err.statusCode = 403; err.code = 'FORBIDDEN'; throw err;
    }

    const activity = await ActivityModel.findById(registration.activity_id)
      .select('name description hero_image_url price schedule')
      .lean();

    return { ...registration, activity };
  }

  // ── GET /admin/registrations ─────────────────────────────────────
  static async adminList(filters, pagination) {
    const query = {};
    if (filters.activity_id) query.activity_id = filters.activity_id;
    if (filters.status)      query.status       = filters.status;

    const page  = Math.max(1, pagination.page  || 1);
    const limit = Math.max(1, pagination.limit || 50);
    const skip  = (page - 1) * limit;

    const [total, registrations] = await Promise.all([
      RegistrationModel.countDocuments(query),
      RegistrationModel.find(query)
        .sort({ registered_at: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user_id',     'first_name last_name nickname email phone gender interests profile_image_url address education_level institution created_at')
        .populate('activity_id', 'name price seat_capacity enrolled_count open_registration_at close_registration_at registration_open_override is_featured created_at updated_at')
        .lean(),
    ]);

    return { meta: { page, limit, total }, data: registrations };
  }

  // ── PATCH /admin/registrations/:id/status ────────────────────────
  static async adminUpdateStatus(registrationId, newStatus, groupName) {
    if (!newStatus) {
      const err = new Error('status is required.');
      err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
    }

    const registration = await RegistrationModel.findById(registrationId).lean();
    if (!registration) {
      const err = new Error('Registration not found.');
      err.statusCode = 404; err.code = 'NOT_FOUND'; throw err;
    }

    const allowed = VALID_TRANSITIONS[registration.status] || [];
    if (!allowed.includes(newStatus)) {
      const err = new Error(
        `Cannot transition from ${registration.status} to ${newStatus}. ` +
        `Allowed: ${allowed.length ? allowed.join(', ') : 'none (terminal state)'}.`
      );
      err.statusCode = 422; err.code = 'INVALID_STATUS_TRANSITION'; throw err;
    }

    const $set = { status: newStatus };
    if (groupName !== undefined) $set.group_name = groupName;

    const updated = await RegistrationModel.findByIdAndUpdate(
      registrationId, { $set }, { new: true }
    ).lean();

    const wasActive = ['PAID', 'JOINED'].includes(registration.status);

    if (!wasActive && newStatus === 'PAID') {
      await ActivityModel.findByIdAndUpdate(registration.activity_id, { $inc: { enrolled_count: 1 } });
    } else if (wasActive && newStatus === 'CANCELLED') {
      await ActivityModel.findByIdAndUpdate(registration.activity_id, { $inc: { enrolled_count: -1 } });
    }

    return updated;
  }
}

function _computeIsOpen(activity) {
  if (activity.registration_open_override !== null && activity.registration_open_override !== undefined) {
    return activity.registration_open_override;
  }
  const now         = new Date();
  const afterOpen   = !activity.open_registration_at  || now >= new Date(activity.open_registration_at);
  const beforeClose = !activity.close_registration_at || now <= new Date(activity.close_registration_at);
  return afterOpen && beforeClose;
}

module.exports = RegistrationHelper;
