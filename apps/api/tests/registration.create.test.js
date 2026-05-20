/**
 * tests/registration.create.test.js
 *
 * Tests for POST /v1/registrations
 *
 * CASE A — existing user (Bearer token present)
 * CASE B — new user (no token, new_user payload)
 *
 * Mocks: UserModel, ActivityModel, RegistrationModel
 */

const request = require('supertest');
const bcrypt  = require('bcrypt');

jest.mock('../src/app/models/User.model');
jest.mock('../src/app/models/Activity.model');
jest.mock('../src/app/models/Registration.model');

const UserModel         = require('../src/app/models/User.model');
const ActivityModel     = require('../src/app/models/Activity.model');
const RegistrationModel = require('../src/app/models/Registration.model');

const buildApp = require('./helpers/app');
const JWTUtil  = require('../src/app/utils/JWT.util');

const app = buildApp();

// ── Fixtures ──────────────────────────────────────────────────────────────────
const EXISTING_USER = {
  _id:      'user-uuid-existing',
  nickname: 'Golf',
  email:    'golf@example.com',
  role:     'user',
};

const USER_TOKEN = JWTUtil.signAccess({
  sub:      EXISTING_USER._id,
  nickname: EXISTING_USER.nickname,
  role:     'user',
});

const OPEN_ACTIVITY = {
  _id:                  'activity-uuid-001',
  name:                 'Improv Workshop',
  price:                500,
  seat_capacity:        30,
  enrolled_count:       10,
  is_registration_open: true,
  extra_questions: [
    { question_id: 'q1', question_text: 'T-Shirt size?', type: 'single_choice', is_required: true },
  ],
};

const FREE_ACTIVITY = {
  ...OPEN_ACTIVITY,
  _id:   'activity-uuid-free',
  price: 0,
  extra_questions: [],
};

const CLOSED_ACTIVITY  = { ...OPEN_ACTIVITY, _id: 'activity-uuid-closed', is_registration_open: false };
const FULL_ACTIVITY    = { ...OPEN_ACTIVITY, _id: 'activity-uuid-full',   enrolled_count: 30 };

const VALID_ANSWERS = [{ question_id: 'q1', answer: 'M' }];

const SAVED_REGISTRATION = {
  _id:           'reg-uuid-001',
  user_id:       EXISTING_USER._id,
  activity_id:   OPEN_ACTIVITY._id,
  status:        'PENDING',
  registered_at: new Date().toISOString(),
};

const NEW_USER_PAYLOAD = {
  first_name: 'Malee',
  last_name:  'Sooksai',
  nickname:   'May',
  email:      'may@example.com',
  phone:      '0898765432',
  password:   'NewPass@123',
  gender:     'Female',
};

// Helper — make requireAuth / optionalAuth resolve to the existing user
function mockExistingUser() {
  UserModel.findById = jest.fn().mockReturnValue({ lean: () => Promise.resolve(EXISTING_USER) });
}

afterEach(() => jest.clearAllMocks());

// =============================================================================
// CASE A — Existing user
// =============================================================================
describe('POST /v1/registrations — Case A (existing user)', () => {

  test('201 — creates PENDING registration for a paid activity', async () => {
    mockExistingUser();
    ActivityModel.findById    = jest.fn().mockReturnValue({ lean: () => Promise.resolve(OPEN_ACTIVITY) });
    RegistrationModel.findOne = jest.fn().mockReturnValue({ lean: () => Promise.resolve(null) });
    RegistrationModel.create  = jest.fn().mockResolvedValue(SAVED_REGISTRATION);

    const res = await request(app)
      .post('/v1/registrations')
      .set('Authorization', `Bearer ${USER_TOKEN}`)
      .send({ activity_id: OPEN_ACTIVITY._id, custom_answers: VALID_ANSWERS });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.registration_id).toBe(SAVED_REGISTRATION._id);
    expect(res.body.data.status).toBe('PENDING');
    // No access_token for existing users
    expect(res.body.data.access_token).toBeUndefined();
  });

  test('201 — free activity sets status PAID and increments enrolled_count', async () => {
    mockExistingUser();
    ActivityModel.findById        = jest.fn().mockReturnValue({ lean: () => Promise.resolve(FREE_ACTIVITY) });
    RegistrationModel.findOne     = jest.fn().mockReturnValue({ lean: () => Promise.resolve(null) });
    RegistrationModel.create      = jest.fn().mockResolvedValue({ ...SAVED_REGISTRATION, status: 'PAID' });
    ActivityModel.findByIdAndUpdate = jest.fn().mockResolvedValue({});

    const res = await request(app)
      .post('/v1/registrations')
      .set('Authorization', `Bearer ${USER_TOKEN}`)
      .send({ activity_id: FREE_ACTIVITY._id, custom_answers: [] });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('PAID');

    // enrolled_count must be incremented via $inc
    expect(ActivityModel.findByIdAndUpdate).toHaveBeenCalledWith(
      FREE_ACTIVITY._id,
      { $inc: { enrolled_count: 1 } }
    );
  });

  test('enrolled_count NOT incremented for paid (non-free) activity on registration', async () => {
    mockExistingUser();
    ActivityModel.findById        = jest.fn().mockReturnValue({ lean: () => Promise.resolve(OPEN_ACTIVITY) });
    RegistrationModel.findOne     = jest.fn().mockReturnValue({ lean: () => Promise.resolve(null) });
    RegistrationModel.create      = jest.fn().mockResolvedValue(SAVED_REGISTRATION);
    ActivityModel.findByIdAndUpdate = jest.fn().mockResolvedValue({});

    await request(app)
      .post('/v1/registrations')
      .set('Authorization', `Bearer ${USER_TOKEN}`)
      .send({ activity_id: OPEN_ACTIVITY._id, custom_answers: VALID_ANSWERS });

    expect(ActivityModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  test('422 REGISTRATION_CLOSED — activity not accepting registrations', async () => {
    mockExistingUser();
    ActivityModel.findById = jest.fn().mockReturnValue({ lean: () => Promise.resolve(CLOSED_ACTIVITY) });

    const res = await request(app)
      .post('/v1/registrations')
      .set('Authorization', `Bearer ${USER_TOKEN}`)
      .send({ activity_id: CLOSED_ACTIVITY._id, custom_answers: VALID_ANSWERS });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('REGISTRATION_CLOSED');
    expect(RegistrationModel.create).not.toHaveBeenCalled();
  });

  test('422 ACTIVITY_FULL — enrolled_count >= seat_capacity', async () => {
    mockExistingUser();
    ActivityModel.findById = jest.fn().mockReturnValue({ lean: () => Promise.resolve(FULL_ACTIVITY) });

    const res = await request(app)
      .post('/v1/registrations')
      .set('Authorization', `Bearer ${USER_TOKEN}`)
      .send({ activity_id: FULL_ACTIVITY._id, custom_answers: VALID_ANSWERS });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('ACTIVITY_FULL');
    expect(RegistrationModel.create).not.toHaveBeenCalled();
  });

  test('409 DUPLICATE_REGISTRATION — already registered (non-cancelled)', async () => {
    mockExistingUser();
    ActivityModel.findById    = jest.fn().mockReturnValue({ lean: () => Promise.resolve(OPEN_ACTIVITY) });
    RegistrationModel.findOne = jest.fn().mockReturnValue({
      lean: () => Promise.resolve(SAVED_REGISTRATION), // existing registration
    });

    const res = await request(app)
      .post('/v1/registrations')
      .set('Authorization', `Bearer ${USER_TOKEN}`)
      .send({ activity_id: OPEN_ACTIVITY._id, custom_answers: VALID_ANSWERS });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE_REGISTRATION');
    expect(RegistrationModel.create).not.toHaveBeenCalled();
  });

  test('cancelled registration does not block re-registration', async () => {
    mockExistingUser();
    ActivityModel.findById    = jest.fn().mockReturnValue({ lean: () => Promise.resolve(OPEN_ACTIVITY) });
    // findOne with $nin CANCELLED returns null — user can re-register
    RegistrationModel.findOne = jest.fn().mockReturnValue({ lean: () => Promise.resolve(null) });
    RegistrationModel.create  = jest.fn().mockResolvedValue(SAVED_REGISTRATION);

    const res = await request(app)
      .post('/v1/registrations')
      .set('Authorization', `Bearer ${USER_TOKEN}`)
      .send({ activity_id: OPEN_ACTIVITY._id, custom_answers: VALID_ANSWERS });

    expect(res.status).toBe(201);

    // Confirm the duplicate check excludes CANCELLED
    const [filter] = RegistrationModel.findOne.mock.calls[0];
    expect(filter.status.$nin).toContain('CANCELLED');
  });

  test('400 VALIDATION_ERROR — required question not answered', async () => {
    mockExistingUser();
    ActivityModel.findById    = jest.fn().mockReturnValue({ lean: () => Promise.resolve(OPEN_ACTIVITY) });
    RegistrationModel.findOne = jest.fn().mockReturnValue({ lean: () => Promise.resolve(null) });

    const res = await request(app)
      .post('/v1/registrations')
      .set('Authorization', `Bearer ${USER_TOKEN}`)
      .send({ activity_id: OPEN_ACTIVITY._id, custom_answers: [] }); // missing q1

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.field).toBe('custom_answers');
    expect(RegistrationModel.create).not.toHaveBeenCalled();
  });

  test('404 NOT_FOUND — activity does not exist', async () => {
    mockExistingUser();
    ActivityModel.findById = jest.fn().mockReturnValue({ lean: () => Promise.resolve(null) });

    const res = await request(app)
      .post('/v1/registrations')
      .set('Authorization', `Bearer ${USER_TOKEN}`)
      .send({ activity_id: 'ghost-id', custom_answers: [] });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  test('400 VALIDATION_ERROR — missing activity_id', async () => {
    mockExistingUser();

    const res = await request(app)
      .post('/v1/registrations')
      .set('Authorization', `Bearer ${USER_TOKEN}`)
      .send({ custom_answers: VALID_ANSWERS });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// =============================================================================
// CASE B — New user (no Bearer token)
// =============================================================================
describe('POST /v1/registrations — Case B (new user)', () => {

  test('201 — creates account + registration, returns access_token', async () => {
    const CREATED_USER = { _id: 'new-user-uuid', nickname: 'May', role: 'user' };

    // optionalAuth: no token → req.user = null (no findById call needed)
    UserModel.findOne    = jest.fn().mockReturnValue({ lean: () => Promise.resolve(null) }); // email not taken
    UserModel.create     = jest.fn().mockResolvedValue(CREATED_USER);
    ActivityModel.findById    = jest.fn().mockReturnValue({ lean: () => Promise.resolve(FREE_ACTIVITY) });
    RegistrationModel.findOne = jest.fn().mockReturnValue({ lean: () => Promise.resolve(null) });
    RegistrationModel.create  = jest.fn().mockResolvedValue({ ...SAVED_REGISTRATION, user_id: CREATED_USER._id, status: 'PAID' });
    ActivityModel.findByIdAndUpdate = jest.fn().mockResolvedValue({});

    const res = await request(app)
      .post('/v1/registrations')
      // No Authorization header
      .send({ activity_id: FREE_ACTIVITY._id, custom_answers: [], new_user: NEW_USER_PAYLOAD });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    // New user must get an access_token in the response
    expect(res.body.data.access_token).toBeDefined();
    expect(typeof res.body.data.access_token).toBe('string');
    // Account must have been created
    expect(UserModel.create).toHaveBeenCalledTimes(1);
  });

  test('email in new_user is lowercased before uniqueness check', async () => {
    const CREATED_USER = { _id: 'new-user-uuid-2', nickname: 'May', role: 'user' };

    UserModel.findOne    = jest.fn().mockReturnValue({ lean: () => Promise.resolve(null) });
    UserModel.create     = jest.fn().mockResolvedValue(CREATED_USER);
    ActivityModel.findById    = jest.fn().mockReturnValue({ lean: () => Promise.resolve(FREE_ACTIVITY) });
    RegistrationModel.findOne = jest.fn().mockReturnValue({ lean: () => Promise.resolve(null) });
    RegistrationModel.create  = jest.fn().mockResolvedValue({ ...SAVED_REGISTRATION, status: 'PAID' });
    ActivityModel.findByIdAndUpdate = jest.fn().mockResolvedValue({});

    await request(app)
      .post('/v1/registrations')
      .send({ activity_id: FREE_ACTIVITY._id, custom_answers: [], new_user: { ...NEW_USER_PAYLOAD, email: 'MAY@EXAMPLE.COM' } });

    const [emailFilter] = UserModel.findOne.mock.calls[0];
    expect(emailFilter.email).toBe('may@example.com');

    const createArg = UserModel.create.mock.calls[0][0];
    expect(createArg.email).toBe('may@example.com');
  });

  test('409 DUPLICATE_EMAIL — email already registered', async () => {
    UserModel.findOne = jest.fn().mockReturnValue({ lean: () => Promise.resolve(EXISTING_USER) });

    const res = await request(app)
      .post('/v1/registrations')
      .send({ activity_id: FREE_ACTIVITY._id, custom_answers: [], new_user: NEW_USER_PAYLOAD });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE_EMAIL');
    expect(UserModel.create).not.toHaveBeenCalled();
    expect(RegistrationModel.create).not.toHaveBeenCalled();
  });

  test('400 VALIDATION_ERROR — missing required new_user fields', async () => {
    const res = await request(app)
      .post('/v1/registrations')
      .send({
        activity_id:  FREE_ACTIVITY._id,
        custom_answers: [],
        new_user: { email: 'incomplete@example.com' }, // missing most fields
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(UserModel.create).not.toHaveBeenCalled();
  });

  test('400 VALIDATION_ERROR — no token and no new_user block', async () => {
    const res = await request(app)
      .post('/v1/registrations')
      .send({ activity_id: FREE_ACTIVITY._id, custom_answers: [] });
    // No Bearer, no new_user

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
