const RegistrationModel = require('../models/Registration.model');
const ActivityModel     = require('../models/Activity.model');
const AuthHelper        = require('./Auth.helper');
const JWTUtil           = require('../utils/JWT.util');

const VALID_TRANSITIONS = {
  PENDING:   ['PAID', 'CANCELLED'],
  PAID:      ['JOINED', 'CANCELLED'],
  JOINED:    [],
  CANCELLED: ['PENDING'], // allow re-open if admin made a mistake
};

class RegistrationHelper {

  // ── POST /registrations ──────────────────────────────────────────
  static async create(userId, activityId, customAnswers = [], newUserPayload = null) {
    let accessToken = null;

    if (!userId) {
      if (!newUserPayload) {
        const err = new Error('Provide a Bearer token (existing user) or a new_user object (new user).');
        err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
      }
      const newUser = await AuthHelper.register(newUserPayload);
      userId = newUser._id;
      accessToken = JWTUtil.signAccess({ sub: newUser._id, nickname: newUser.nickname, role: newUser.role || 'user' });
    }

    if (!activityId) {
      const err = new Error('activity_id is required.');
      err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
    }

    const activity = await ActivityModel.findById(activityId).lean();
    if (!activity) {
      const err = new Error('Activity not found.');
      err.statusCode = 404; err.code = 'NOT_FOUND'; throw err;
    }

    // Use helper function to compute open status from date window
    const isOpen = _computeIsOpen(activity);
    if (!isOpen) {
      const err = new Error('This activity is not accepting registrations.');
      err.statusCode = 422; err.code = 'REGISTRATION_CLOSED'; throw err;
    }

    if (activity.enrolled_count >= activity.seat_capacity) {
      const err = new Error('This activity has reached its seat capacity.');
      err.statusCode = 422; err.code = 'ACTIVITY_FULL'; throw err;
    }

    const duplicate = await RegistrationModel.findOne({
      user_id: userId, activity_id: activityId, status: { $nin: ['CANCELLED'] },
    }).lean();
    if (duplicate) {
      const err = new Error('You are already registered for this activity.');
      err.statusCode = 409; err.code = 'DUPLICATE_REGISTRATION'; throw err;
    }

    const requiredQs  = activity.extra_questions.filter(q => q.is_required);
    const answeredIds = (customAnswers || []).map(a => a.question_id);
    const unanswered  = requiredQs.filter(q => !answeredIds.includes(q.question_id));
    if (unanswered.length) {
      const err = new Error(`Missing required answers for: ${unanswered.map(q => q.question_text).join(', ')}.`);
      err.statusCode = 400; err.code = 'VALIDATION_ERROR'; err.field = 'custom_answers'; throw err;
    }

    const isFree = activity.price === 0;
    const status = isFree ? 'PAID' : 'PENDING';

    const registration = await RegistrationModel.create({
      user_id: userId, activity_id: activityId, status, custom_answers: customAnswers || [],
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

  // ── GET /registrations/:id ───────────────────────────────────────
  static async getById(registrationId, requestingUser) {
    throw new Error('Not implemented');
  }

  // ── GET /admin/registrations ─────────────────────────────────────
  static async adminList(filters, pagination) {
    throw new Error('Not implemented');
  }

  // ── PATCH /admin/registrations/:id/status ────────────────────────
  /**
   * Manually override registration status + optionally assign group_name.
   *
   * Transitions enforced:
   *   PENDING   → PAID, CANCELLED
   *   PAID      → JOINED, CANCELLED
   *   JOINED    → (none — terminal)
   *   CANCELLED → PENDING (undo a mistake)
   *
   * Side-effects:
   *   PENDING → PAID  : $inc activity enrolled_count
   *   *       → CANCELLED (from PAID/JOINED) : $dec activity enrolled_count
   */
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

    // Side-effects on enrolled_count
    const wasActive = ['PAID', 'JOINED'].includes(registration.status);
    const nowActive = ['PAID', 'JOINED'].includes(newStatus);

    if (!wasActive && newStatus === 'PAID') {
      // PENDING → PAID: count goes up
      await ActivityModel.findByIdAndUpdate(registration.activity_id, { $inc: { enrolled_count: 1 } });
    } else if (wasActive && newStatus === 'CANCELLED') {
      // PAID/JOINED → CANCELLED: count goes down
      await ActivityModel.findByIdAndUpdate(registration.activity_id, { $inc: { enrolled_count: -1 } });
    }

    return updated;
  }
}

// Mirrors Activity model virtual — needed on lean() objects
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
