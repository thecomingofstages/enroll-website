/**
 * tests/user.test.js
 *
 * Integration-style tests for:
 *   GET   /v1/users/me              (UserHelper.getMe)
 *   PATCH /v1/users/me              (UserHelper.updateMe)
 *   GET   /v1/users/me/activities   (UserHelper.getMyActivities)
 *
 * Mocks: UserModel, RegistrationModel, ActivityModel
 * No real DB or binary downloads needed.
 * Run with: npm test
 *
 * ⚠  Known gap: UserHelper throws err.status but ErrorHandler reads err.statusCode.
 *    Until that's fixed, custom helper errors (400, 404) surface as 500.
 *    Tests document the *current* behaviour so we know when the fix lands.
 */

const request = require('supertest');

// ── Mock models before any app code loads ─────────────────────────────────────
jest.mock('../src/app/models/User.model');
jest.mock('../src/app/models/Registration.model');
jest.mock('../src/app/models/Activity.model');

const UserModel         = require('../src/app/models/User.model');
const RegistrationModel = require('../src/app/models/Registration.model');
const ActivityModel     = require('../src/app/models/Activity.model');

// ── Load app AFTER mocks ──────────────────────────────────────────────────────
const buildApp = require('./helpers/app');
const JWTUtil  = require('../src/app/utils/JWT.util');

const app = buildApp();

// ── Shared fixtures ───────────────────────────────────────────────────────────
const MOCK_USER = {
  _id:               'user-uuid-001',
  first_name:        'Somchai',
  last_name:         'Jaidee',
  nickname:          'Chai',
  email:             'somchai@example.com',
  phone:             '0812345678',
  password_hash:     '$2b$12$fakehashfakehashfakehashfakehashfakehashfakehash',
  role:              'user',
  gender:            'Male',
  interests:         ['music', 'tech'],
  profile_image_url: null,
  address:           null,
  education_level:   null,
  institution:       null,
  created_at:        '2026-01-15T00:00:00.000Z',
};

// A real signed access token for this mock user
const VALID_TOKEN = JWTUtil.signAccess({
  sub:      MOCK_USER._id,
  nickname: MOCK_USER.nickname,
  role:     MOCK_USER.role,
});

/**
 * Helper: make Auth.middleware.requireAuth resolve to a specific user.
 * Auth middleware calls UserModel.findById(decoded.sub).lean().
 */
function mockAuth(user) {
  UserModel.findById = jest.fn().mockReturnValue({
    lean: () => Promise.resolve(user),
  });
}

afterEach(() => jest.clearAllMocks());

// =============================================================================
// GET /v1/users/me
// =============================================================================
describe('GET /v1/users/me', () => {

  test('200 — returns sanitized user profile (password_hash excluded)', async () => {
    mockAuth(MOCK_USER);

    const res = await request(app)
      .get('/v1/users/me')
      .set('Authorization', `Bearer ${VALID_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Correct fields present
    expect(res.body.data._id).toBe(MOCK_USER._id);
    expect(res.body.data.first_name).toBe('Somchai');
    expect(res.body.data.last_name).toBe('Jaidee');
    expect(res.body.data.nickname).toBe('Chai');
    expect(res.body.data.email).toBe(MOCK_USER.email);
    expect(res.body.data.interests).toEqual(['music', 'tech']);

    // password_hash must NEVER leak
    expect(res.body.data).not.toHaveProperty('password_hash');
  });

  test('200 — optional fields (address, education_level, institution) are returned when null', async () => {
    mockAuth(MOCK_USER);

    const res = await request(app)
      .get('/v1/users/me')
      .set('Authorization', `Bearer ${VALID_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.data.address).toBeNull();
    expect(res.body.data.education_level).toBeNull();
    expect(res.body.data.institution).toBeNull();
  });

  test('200 — role and gender fields are present in response', async () => {
    mockAuth(MOCK_USER);

    const res = await request(app)
      .get('/v1/users/me')
      .set('Authorization', `Bearer ${VALID_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('user');
    expect(res.body.data.gender).toBe('Male');
  });

  test('error when user deleted between auth middleware and helper (err.status vs err.statusCode gap)', async () => {
    // Auth middleware finds user (1st findById), but getMe fails (2nd findById returns null).
    // ⚠ Helper throws err.status=404 but ErrorHandler reads err.statusCode → 500.
    // This documents a real bug. When fixed, change expected to 404.
    UserModel.findById = jest.fn()
      .mockReturnValueOnce({ lean: () => Promise.resolve(MOCK_USER) })   // requireAuth
      .mockReturnValueOnce({ lean: () => Promise.resolve(null) });       // getMe

    const res = await request(app)
      .get('/v1/users/me')
      .set('Authorization', `Bearer ${VALID_TOKEN}`);

    // Current behaviour: 500 (err.status not read by ErrorHandler)
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.message).toBe('User not found.');
  });

  test('401 — no Authorization header returns TOKEN_MISSING', async () => {
    const res = await request(app).get('/v1/users/me');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_MISSING');
  });

  test('401 — expired or invalid JWT is rejected', async () => {
    const res = await request(app)
      .get('/v1/users/me')
      .set('Authorization', 'Bearer not.valid.jwt');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_EXPIRED');
  });

  test('500-safe — DB error in findById is caught by ErrorHandler', async () => {
    UserModel.findById = jest.fn()
      .mockReturnValueOnce({ lean: () => Promise.resolve(MOCK_USER) })   // requireAuth
      .mockReturnValueOnce({ lean: () => Promise.reject(new Error('DB down')) }); // getMe

    const res = await request(app)
      .get('/v1/users/me')
      .set('Authorization', `Bearer ${VALID_TOKEN}`);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });

  test('findById is called with the authenticated user _id', async () => {
    mockAuth(MOCK_USER);

    await request(app)
      .get('/v1/users/me')
      .set('Authorization', `Bearer ${VALID_TOKEN}`);

    // Auth middleware + getMe = 2 calls both with same _id
    expect(UserModel.findById).toHaveBeenCalledWith(MOCK_USER._id);
  });
});

// =============================================================================
// PATCH /v1/users/me
// =============================================================================
describe('PATCH /v1/users/me', () => {

  const UPDATED_USER = {
    ...MOCK_USER,
    nickname:          'ChaiUpdated',
    profile_image_url: 'https://cdn.example.com/avatar.jpg',
  };

  test('200 — updates whitelisted fields and returns sanitized doc', async () => {
    mockAuth(MOCK_USER);
    // Helper passes { lean: true } in options → mongoose returns plain object directly
    UserModel.findByIdAndUpdate = jest.fn().mockResolvedValue(UPDATED_USER);

    const res = await request(app)
      .patch('/v1/users/me')
      .set('Authorization', `Bearer ${VALID_TOKEN}`)
      .send({ nickname: 'ChaiUpdated', profile_image_url: 'https://cdn.example.com/avatar.jpg' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.nickname).toBe('ChaiUpdated');
    expect(res.body.data.profile_image_url).toBe('https://cdn.example.com/avatar.jpg');

    // password_hash must NOT be in the response
    expect(res.body.data).not.toHaveProperty('password_hash');
  });

  test('only allowed fields (nickname, interests, profile_image_url, address, education_level, institution) are included in $set', async () => {
    mockAuth(MOCK_USER);
    UserModel.findByIdAndUpdate = jest.fn().mockResolvedValue(UPDATED_USER);

    await request(app)
      .patch('/v1/users/me')
      .set('Authorization', `Bearer ${VALID_TOKEN}`)
      .send({
        nickname:          'NewNick',
        interests:         ['art'],
        profile_image_url: 'https://cdn.example.com/new.jpg',
        address:           '123 Sukhumvit',
        education_level:   'Bachelor',
        institution:       'CU',
        // These should be silently dropped:
        email:             'hacked@evil.com',
        role:              'admin',
        password_hash:     'injected',
        first_name:        'Hacker',
        _id:               'fake-id',
      });

    const [id, updateArg, opts] = UserModel.findByIdAndUpdate.mock.calls[0];
    expect(id).toBe(MOCK_USER._id);

    // Allowed fields present
    expect(updateArg.$set.nickname).toBe('NewNick');
    expect(updateArg.$set.interests).toEqual(['art']);
    expect(updateArg.$set.profile_image_url).toBe('https://cdn.example.com/new.jpg');
    expect(updateArg.$set.address).toBe('123 Sukhumvit');
    expect(updateArg.$set.education_level).toBe('Bachelor');
    expect(updateArg.$set.institution).toBe('CU');

    // Blocked fields must NOT be in $set
    expect(updateArg.$set.email).toBeUndefined();
    expect(updateArg.$set.role).toBeUndefined();
    expect(updateArg.$set.password_hash).toBeUndefined();
    expect(updateArg.$set.first_name).toBeUndefined();
    expect(updateArg.$set._id).toBeUndefined();

    // Options
    expect(opts.new).toBe(true);
    expect(opts.lean).toBe(true);
  });

  test('single field update — only that field in $set', async () => {
    mockAuth(MOCK_USER);
    UserModel.findByIdAndUpdate = jest.fn().mockResolvedValue({ ...MOCK_USER, institution: 'MIT' });

    await request(app)
      .patch('/v1/users/me')
      .set('Authorization', `Bearer ${VALID_TOKEN}`)
      .send({ institution: 'MIT' });

    const [, updateArg] = UserModel.findByIdAndUpdate.mock.calls[0];
    expect(Object.keys(updateArg.$set)).toEqual(['institution']);
  });

  test('error when body has only blocked/unknown fields (err.status gap → 500)', async () => {
    // ⚠ Helper throws err.status=400 but ErrorHandler reads err.statusCode → 500.
    // When the bug is fixed, change expected to 400.
    mockAuth(MOCK_USER);

    const res = await request(app)
      .patch('/v1/users/me')
      .set('Authorization', `Bearer ${VALID_TOKEN}`)
      .send({ email: 'evil@evil.com', role: 'admin' });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toBe('No valid fields to update.');
    expect(UserModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  test('error when empty body (err.status gap → 500)', async () => {
    mockAuth(MOCK_USER);

    const res = await request(app)
      .patch('/v1/users/me')
      .set('Authorization', `Bearer ${VALID_TOKEN}`)
      .send({});

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('error when user no longer exists during update (err.status gap → 500)', async () => {
    mockAuth(MOCK_USER);
    UserModel.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

    const res = await request(app)
      .patch('/v1/users/me')
      .set('Authorization', `Bearer ${VALID_TOKEN}`)
      .send({ nickname: 'Ghost' });

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  test('401 — no Authorization header returns TOKEN_MISSING', async () => {
    const res = await request(app)
      .patch('/v1/users/me')
      .send({ nickname: 'NoAuth' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_MISSING');
  });

  test('500-safe — DB error in findByIdAndUpdate is caught by ErrorHandler', async () => {
    mockAuth(MOCK_USER);
    UserModel.findByIdAndUpdate = jest.fn().mockRejectedValue(new Error('DB timeout'));

    const res = await request(app)
      .patch('/v1/users/me')
      .set('Authorization', `Bearer ${VALID_TOKEN}`)
      .send({ nickname: 'CrashTest' });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// =============================================================================
// GET /v1/users/me/activities
// =============================================================================
describe('GET /v1/users/me/activities', () => {

  // ── Activity & Registration fixtures ──────────────────────────────────────
  const FUTURE_DATE = new Date(Date.now() + 86400000 * 30).toISOString();  // +30 days
  const PAST_DATE   = new Date(Date.now() - 86400000 * 30).toISOString();  // -30 days

  const REG_1 = {
    _id:           'reg-uuid-001',
    user_id:       MOCK_USER._id,
    activity_id:   'activity-uuid-001',
    status:        'PAID',
    group_name:    'Group A',
    registered_at: '2026-03-01T00:00:00.000Z',
  };
  const REG_2 = {
    _id:           'reg-uuid-002',
    user_id:       MOCK_USER._id,
    activity_id:   'activity-uuid-002',
    status:        'PENDING',
    group_name:    null,
    registered_at: '2026-04-15T00:00:00.000Z',
  };

  const ACTIVITY_UPCOMING = {
    _id:            'activity-uuid-001',
    name:           'Future Workshop',
    hero_image_url: 'https://cdn.example.com/future.jpg',
    schedule:       [{ date: FUTURE_DATE, venue: 'Hall A' }],
    price:          500,
  };
  const ACTIVITY_PAST = {
    _id:            'activity-uuid-002',
    name:           'Past Seminar',
    hero_image_url: 'https://cdn.example.com/past.jpg',
    schedule:       [{ date: PAST_DATE, venue: 'Hall B' }],
    price:          0,
  };

  /**
   * Helper: set up Registration.find and ActivityModel.findById mocks.
   * Registration.find returns { lean() }, Activity.findById returns { select().lean() }.
   */
  function mockRegistrationsAndActivities(registrations, activityMap) {
    RegistrationModel.find = jest.fn().mockReturnValue({
      lean: () => Promise.resolve(registrations),
    });

    ActivityModel.findById = jest.fn().mockImplementation((id) => ({
      select: () => ({
        lean: () => Promise.resolve(activityMap[id] || null),
      }),
    }));
  }

  test('200 — returns all registrations with enriched activity data', async () => {
    mockAuth(MOCK_USER);
    mockRegistrationsAndActivities(
      [REG_1, REG_2],
      { [REG_1.activity_id]: ACTIVITY_UPCOMING, [REG_2.activity_id]: ACTIVITY_PAST }
    );

    const res = await request(app)
      .get('/v1/users/me/activities')
      .set('Authorization', `Bearer ${VALID_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);

    // First item shape
    const item = res.body.data[0];
    expect(item).toHaveProperty('registration_id');
    expect(item).toHaveProperty('status');
    expect(item).toHaveProperty('registered_at');
    expect(item).toHaveProperty('group_name');
    expect(item).toHaveProperty('activity');
    expect(item.activity).toHaveProperty('_id');
    expect(item.activity).toHaveProperty('name');
  });

  test('200 — ?status=upcoming filters to activities with future schedule dates', async () => {
    mockAuth(MOCK_USER);
    mockRegistrationsAndActivities(
      [REG_1, REG_2],
      { [REG_1.activity_id]: ACTIVITY_UPCOMING, [REG_2.activity_id]: ACTIVITY_PAST }
    );

    const res = await request(app)
      .get('/v1/users/me/activities?status=upcoming')
      .set('Authorization', `Bearer ${VALID_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].activity.name).toBe('Future Workshop');
  });

  test('200 — ?status=past filters to activities with all past schedule dates', async () => {
    mockAuth(MOCK_USER);
    mockRegistrationsAndActivities(
      [REG_1, REG_2],
      { [REG_1.activity_id]: ACTIVITY_UPCOMING, [REG_2.activity_id]: ACTIVITY_PAST }
    );

    const res = await request(app)
      .get('/v1/users/me/activities?status=past')
      .set('Authorization', `Bearer ${VALID_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].activity.name).toBe('Past Seminar');
  });

  test('200 — ?reg_status=PAID filters registrations by registration status', async () => {
    mockAuth(MOCK_USER);
    mockRegistrationsAndActivities(
      [REG_1],
      { [REG_1.activity_id]: ACTIVITY_UPCOMING }
    );

    const res = await request(app)
      .get('/v1/users/me/activities?reg_status=PAID')
      .set('Authorization', `Bearer ${VALID_TOKEN}`);

    expect(res.status).toBe(200);

    // Verify the query passed to Registration.find includes status filter
    const findArg = RegistrationModel.find.mock.calls[0][0];
    expect(findArg.user_id).toBe(MOCK_USER._id);
    expect(findArg.status).toBe('PAID');
  });

  test('200 — both status and reg_status can be used together', async () => {
    mockAuth(MOCK_USER);
    mockRegistrationsAndActivities(
      [REG_1],
      { [REG_1.activity_id]: ACTIVITY_UPCOMING }
    );

    const res = await request(app)
      .get('/v1/users/me/activities?status=upcoming&reg_status=PAID')
      .set('Authorization', `Bearer ${VALID_TOKEN}`);

    expect(res.status).toBe(200);

    // reg_status forwarded to Registration.find
    const findArg = RegistrationModel.find.mock.calls[0][0];
    expect(findArg.status).toBe('PAID');

    // status=upcoming applied after enrichment
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].activity.name).toBe('Future Workshop');
  });

  test('200 — returns empty array when user has no registrations', async () => {
    mockAuth(MOCK_USER);
    mockRegistrationsAndActivities([], {});

    const res = await request(app)
      .get('/v1/users/me/activities')
      .set('Authorization', `Bearer ${VALID_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  test('200 — gracefully handles null activity (deleted activity)', async () => {
    mockAuth(MOCK_USER);
    mockRegistrationsAndActivities(
      [REG_1],
      {}  // activity not found → null
    );

    const res = await request(app)
      .get('/v1/users/me/activities')
      .set('Authorization', `Bearer ${VALID_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].activity).toBeNull();
  });

  test('response shape: each item has registration_id, status, registered_at, group_name, activity', async () => {
    mockAuth(MOCK_USER);
    mockRegistrationsAndActivities(
      [REG_1],
      { [REG_1.activity_id]: ACTIVITY_UPCOMING }
    );

    const res = await request(app)
      .get('/v1/users/me/activities')
      .set('Authorization', `Bearer ${VALID_TOKEN}`);

    const item = res.body.data[0];
    expect(Object.keys(item)).toEqual(
      expect.arrayContaining(['registration_id', 'status', 'registered_at', 'group_name', 'activity'])
    );
    expect(item.registration_id).toBe(REG_1._id);
    expect(item.status).toBe('PAID');
    expect(item.registered_at).toBe(REG_1.registered_at);
    expect(item.group_name).toBe('Group A');
  });

  test('null group_name is preserved in response', async () => {
    mockAuth(MOCK_USER);
    mockRegistrationsAndActivities(
      [REG_2],
      { [REG_2.activity_id]: ACTIVITY_PAST }
    );

    const res = await request(app)
      .get('/v1/users/me/activities')
      .set('Authorization', `Bearer ${VALID_TOKEN}`);

    expect(res.body.data[0].group_name).toBeNull();
  });

  test('401 — no Authorization header returns TOKEN_MISSING', async () => {
    const res = await request(app).get('/v1/users/me/activities');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_MISSING');
  });

  test('401 — invalid JWT returns TOKEN_EXPIRED', async () => {
    const res = await request(app)
      .get('/v1/users/me/activities')
      .set('Authorization', 'Bearer bad.token.here');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_EXPIRED');
  });

  test('500-safe — DB error in Registration.find is caught by ErrorHandler', async () => {
    mockAuth(MOCK_USER);
    RegistrationModel.find = jest.fn().mockReturnValue({
      lean: () => Promise.reject(new Error('Connection refused')),
    });

    const res = await request(app)
      .get('/v1/users/me/activities')
      .set('Authorization', `Bearer ${VALID_TOKEN}`);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});
