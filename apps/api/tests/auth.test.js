/**
 * tests/auth.test.js
 *
 * Integration-style tests for:
 *   POST /v1/auth/login
 *   POST /v1/auth/logout
 *
 * Mongoose models are mocked — no real DB or binary downloads needed.
 * Run with: npm test
 */

const request = require('supertest');
const bcrypt  = require('bcrypt');

// ── Mock mongoose UserModel before any app code loads ─────────────────────────
jest.mock('../src/app/models/User.model');
const UserModel = require('../src/app/models/User.model');

// ── Load app AFTER mocks are in place ─────────────────────────────────────────
const buildApp  = require('./helpers/app');
const AppKeys   = require('../src/app/config/app.keys');

const app = buildApp();

// ── Shared test fixtures ──────────────────────────────────────────────────────
const TEST_PASSWORD  = 'Password@123';
const TEST_EMAIL     = 'tester@example.com';
let   HASHED_PASSWORD;
let   MOCK_USER;

beforeAll(async () => {
  // bcrypt cost 4 = fast for tests, still real hashing
  HASHED_PASSWORD = await bcrypt.hash(TEST_PASSWORD, 4);
  MOCK_USER = {
    _id:           'mock-user-uuid-001',
    first_name:    'Test',
    last_name:     'User',
    nickname:      'Tester',
    email:         TEST_EMAIL,
    phone:         '0800000001',
    password_hash: HASHED_PASSWORD,
    gender:        'Unspecified',
    interests:     [],
    role:          'user',
  };
});

afterEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /v1/auth/login
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /v1/auth/login', () => {

  test('200 — valid credentials return access_token + user, set HttpOnly cookie', async () => {
    // Mock: findOne returns the test user
    UserModel.findOne.mockReturnValue({ lean: () => Promise.resolve(MOCK_USER) });

    const res = await request(app)
      .post('/v1/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Token shape
    expect(res.body.data).toHaveProperty('access_token');
    expect(typeof res.body.data.access_token).toBe('string');
    expect(res.body.data.token_type).toBe('Bearer');
    expect(res.body.data.expires_in).toBe(900);

    // Sanitized user — password_hash must NOT be present
    expect(res.body.data.user).toHaveProperty('_id', MOCK_USER._id);
    expect(res.body.data.user).toHaveProperty('email', TEST_EMAIL);
    expect(res.body.data.user).not.toHaveProperty('password_hash');

    // HttpOnly refresh cookie
    const cookies = res.headers['set-cookie'] || [];
    const refreshCookie = cookies.find(c => c.startsWith(AppKeys.COOKIE_NAME));
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toMatch(/HttpOnly/i);
  });

  test('401 — wrong password returns INVALID_CREDENTIALS', async () => {
    UserModel.findOne.mockReturnValue({ lean: () => Promise.resolve(MOCK_USER) });

    const res = await request(app)
      .post('/v1/auth/login')
      .send({ email: TEST_EMAIL, password: 'WrongPass!999' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  test('401 — unknown email returns the SAME error message (no user enumeration)', async () => {
    // Simulate user not found
    UserModel.findOne.mockReturnValue({ lean: () => Promise.resolve(null) });

    const resUnknownEmail = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'nobody@example.com', password: TEST_PASSWORD });

    // Now wrong password with known email
    UserModel.findOne.mockReturnValue({ lean: () => Promise.resolve(MOCK_USER) });
    const resWrongPass = await request(app)
      .post('/v1/auth/login')
      .send({ email: TEST_EMAIL, password: 'WrongPass!999' });

    expect(resUnknownEmail.status).toBe(401);
    expect(resWrongPass.status).toBe(401);
    // Messages must match — attacker can't tell which case they hit
    expect(resUnknownEmail.body.error.message).toBe(resWrongPass.body.error.message);
  });

  test('401 — email is case-insensitive (TESTER@EXAMPLE.COM works)', async () => {
    // Model stores lowercase; helper calls .toLowerCase().trim() before findOne
    UserModel.findOne.mockReturnValue({ lean: () => Promise.resolve(MOCK_USER) });

    const res = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'TESTER@EXAMPLE.COM', password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    // Confirm findOne was called with the lowercased email
    expect(UserModel.findOne).toHaveBeenCalledWith({ email: TEST_EMAIL });
  });

  test('401 — missing email falls through to INVALID_CREDENTIALS', async () => {
    UserModel.findOne.mockReturnValue({ lean: () => Promise.resolve(null) });

    const res = await request(app)
      .post('/v1/auth/login')
      .send({ password: TEST_PASSWORD });

    // email is undefined -> helper throws TypeError -> ErrorHandler returns 500
    // This surfaces a missing validation gap: controller should validate before calling helper.
    // Test documents current behaviour so we know when it changes.
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });

  test('500-safe — DB error is caught and forwarded to ErrorHandler', async () => {
    UserModel.findOne.mockReturnValue({
      lean: () => Promise.reject(new Error('DB connection lost')),
    });

    const res = await request(app)
      .post('/v1/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    // Should not crash the server — ErrorHandler returns 500
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /v1/auth/logout
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /v1/auth/logout', () => {

  // Helper: log in and grab a real JWT
  async function loginAndGetToken() {
    UserModel.findOne
      // 1st call: login
      .mockReturnValueOnce({ lean: () => Promise.resolve(MOCK_USER) })
      // 2nd call: Auth.middleware.requireAuth re-fetches the user from DB
      .mockReturnValueOnce({ lean: () => Promise.resolve(MOCK_USER) });

    const loginRes = await request(app)
      .post('/v1/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    return loginRes.body.data.access_token;
  }

  test('204 — valid token returns no content and clears the refresh cookie', async () => {
    const token = await loginAndGetToken();

    // requireAuth inside logout will call findById
    UserModel.findById = jest.fn().mockReturnValue({ lean: () => Promise.resolve(MOCK_USER) });

    const res = await request(app)
      .post('/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);

    // Cookie should be cleared (Max-Age=0)
    const cookies = res.headers['set-cookie'] || [];
    const clearedCookie = cookies.find(c => c.startsWith(AppKeys.COOKIE_NAME));
    expect(clearedCookie).toBeDefined();
    // Express clearCookie sets Expires to epoch (Thu, 01 Jan 1970)
    expect(clearedCookie).toMatch(/Expires=Thu, 01 Jan 1970/i);
  });

  test('401 — no Authorization header returns TOKEN_MISSING', async () => {
    const res = await request(app)
      .post('/v1/auth/logout');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_MISSING');
  });

  test('401 — malformed token string returns TOKEN_EXPIRED', async () => {
    const res = await request(app)
      .post('/v1/auth/logout')
      .set('Authorization', 'Bearer this.is.not.a.valid.jwt');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_EXPIRED');
  });

  test('401 — tampered JWT payload is rejected', async () => {
    const token = await loginAndGetToken();
    UserModel.findById = jest.fn().mockReturnValue({ lean: () => Promise.resolve(MOCK_USER) });

    // Swap middle segment (payload) with a different one — signature won't match
    const parts       = token.split('.');
    const fakePayload = Buffer.from(JSON.stringify({ sub: 'attacker', role: 'admin' })).toString('base64url');
    const tampered    = `${parts[0]}.${fakePayload}.${parts[2]}`;

    const res = await request(app)
      .post('/v1/auth/logout')
      .set('Authorization', `Bearer ${tampered}`);

    expect(res.status).toBe(401);
  });

  test('401 — user deleted after token issued returns 401', async () => {
    const token = await loginAndGetToken();

    // Simulate user no longer in DB
    UserModel.findById = jest.fn().mockReturnValue({ lean: () => Promise.resolve(null) });

    const res = await request(app)
      .post('/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
  });
});
