/**
 * tests/user.qr.test.js
 *
 * Tests for GET /v1/users/me/qr
 *
 * QR token is a HMAC-signed compact token:
 *   base64url(JSON payload) + '.' + HMAC-SHA256 signature
 *
 * Mocks: UserModel (for Auth.middleware.requireAuth DB lookup)
 * No real DB needed.
 */

const request = require('supertest');
const crypto  = require('crypto');

// ── Mock UserModel before app loads ──────────────────────────────────────────
jest.mock('../src/app/models/User.model');
const UserModel = require('../src/app/models/User.model');

const buildApp = require('./helpers/app');
const AppKeys  = require('../src/app/config/app.keys');
const JWTUtil  = require('../src/app/utils/JWT.util');
const QRUtil   = require('../src/app/utils/QR.util');

const app = buildApp();

// ── Shared fixtures ───────────────────────────────────────────────────────────
const MOCK_USER = {
  _id:      'user-uuid-qr-001',
  nickname: 'Tester',
  email:    'tester@example.com',
  role:     'user',
};

// A real signed access token for this mock user
const VALID_TOKEN = JWTUtil.signAccess({
  sub:      MOCK_USER._id,
  nickname: MOCK_USER.nickname,
  role:     MOCK_USER.role,
});

// Make Auth.middleware.requireAuth always resolve to MOCK_USER
beforeEach(() => {
  UserModel.findById = jest.fn().mockReturnValue({
    lean: () => Promise.resolve(MOCK_USER),
  });
});

afterEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────────────────────────────────────
// GET /v1/users/me/qr
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /v1/users/me/qr', () => {

  test('200 — returns qr_token, expires_at, expires_in', async () => {
    const before = Math.floor(Date.now() / 1000);

    const res = await request(app)
      .get('/v1/users/me/qr')
      .set('Authorization', `Bearer ${VALID_TOKEN}`);

    const after = Math.floor(Date.now() / 1000);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { qr_token, expires_at, expires_in } = res.body.data;

    // Shape checks
    expect(typeof qr_token).toBe('string');
    expect(qr_token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/); // base64url.sig
    expect(expires_in).toBe(AppKeys.QR_TTL_SECONDS);               // 300
    expect(new Date(expires_at).getTime()).toBeGreaterThan(0);      // valid ISO date
  });

  test('token payload contains correct user_id and expiry window', async () => {
    const before = Math.floor(Date.now() / 1000);

    const res = await request(app)
      .get('/v1/users/me/qr')
      .set('Authorization', `Bearer ${VALID_TOKEN}`);

    const after = Math.floor(Date.now() / 1000);
    const { qr_token } = res.body.data;

    // Decode payload (first segment) without verifying — we check verify() separately
    const [encoded] = qr_token.split('.');
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));

    expect(payload.user_id).toBe(MOCK_USER._id);
    expect(payload.iat).toBeGreaterThanOrEqual(before);
    expect(payload.iat).toBeLessThanOrEqual(after);
    expect(payload.exp).toBe(payload.iat + AppKeys.QR_TTL_SECONDS);
  });

  test('token passes QRUtil.verify() immediately after issue', async () => {
    const res = await request(app)
      .get('/v1/users/me/qr')
      .set('Authorization', `Bearer ${VALID_TOKEN}`);

    const { qr_token } = res.body.data;

    // Should not throw
    const decoded = QRUtil.verify(qr_token);
    expect(decoded.user_id).toBe(MOCK_USER._id);
  });

  test('expires_at ISO string matches exp claim in payload', async () => {
    const res = await request(app)
      .get('/v1/users/me/qr')
      .set('Authorization', `Bearer ${VALID_TOKEN}`);

    const { qr_token, expires_at } = res.body.data;
    const [encoded] = qr_token.split('.');
    const payload   = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));

    // expires_at should represent the same second as payload.exp
    const expiresAtSec = Math.floor(new Date(expires_at).getTime() / 1000);
    expect(expiresAtSec).toBe(payload.exp);
  });

  test('two consecutive calls return different tokens (unique iat)', async () => {
    const res1 = await request(app)
      .get('/v1/users/me/qr')
      .set('Authorization', `Bearer ${VALID_TOKEN}`);

    // Small delay so iat can differ by at least 1s
    await new Promise(r => setTimeout(r, 1010));

    const res2 = await request(app)
      .get('/v1/users/me/qr')
      .set('Authorization', `Bearer ${VALID_TOKEN}`);

    expect(res1.body.data.qr_token).not.toBe(res2.body.data.qr_token);
  });

  test('HMAC signature is correct — tampered payload is rejected by QRUtil.verify()', async () => {
    const res = await request(app)
      .get('/v1/users/me/qr')
      .set('Authorization', `Bearer ${VALID_TOKEN}`);

    const { qr_token } = res.body.data;
    const [, sig] = qr_token.split('.');

    // Forge a payload with a different user_id, keep the original signature
    const fakePayload = Buffer.from(
      JSON.stringify({ user_id: 'attacker-id', iat: 0, exp: 9999999999 })
    ).toString('base64url');

    expect(() => QRUtil.verify(`${fakePayload}.${sig}`)).toThrow();
  });

  test('QRUtil.verify() throws QR_EXPIRED for an expired token', () => {
    // Manually craft an already-expired token
    const now     = Math.floor(Date.now() / 1000);
    const payload = { user_id: MOCK_USER._id, iat: now - 400, exp: now - 100 }; // expired 100s ago
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig     = crypto
      .createHmac('sha256', AppKeys.QR_HMAC_SECRET)
      .update(encoded)
      .digest('base64url');
    const expiredToken = `${encoded}.${sig}`;

    expect(() => QRUtil.verify(expiredToken)).toThrow(
      expect.objectContaining({ code: 'QR_EXPIRED' })
    );
  });

  test('401 — no Authorization header returns TOKEN_MISSING', async () => {
    const res = await request(app).get('/v1/users/me/qr');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_MISSING');
  });

  test('401 — expired or invalid JWT is rejected before reaching helper', async () => {
    const res = await request(app)
      .get('/v1/users/me/qr')
      .set('Authorization', 'Bearer not.a.real.token');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_EXPIRED');
  });
});
