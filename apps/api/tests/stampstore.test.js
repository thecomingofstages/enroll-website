/**
 * tests/stampstore.test.js
 *
 * Tests for:
 *   POST /v1/stampstore/createstamp   (#25 — Chompoo)
 *   PATCH /v1/admin/stampstore/markexchanged  (#27 — Chompoo)
 *
 * Mocks: UserModel, StoreModel, StampUserModel
 */

const request = require('supertest');

jest.mock('../src/app/models/User.model');
jest.mock('../src/app/models/Store.model');
jest.mock('../src/app/models/StampUser.model');

const UserModel      = require('../src/app/models/User.model');
const StoreModel     = require('../src/app/models/Store.model');
const StampUserModel = require('../src/app/models/StampUser.model');

const buildApp = require('./helpers/app');
const JWTUtil  = require('../src/app/utils/JWT.util');
const crypto   = require('crypto');

const app = buildApp();

// ── Fixtures ──────────────────────────────────────────────────────────────────
const PLAIN_USER = { _id: 'user-uuid-001', nickname: 'Golf', role: 'user' };
const ADMIN_USER = { _id: 'admin-uuid-001', nickname: 'Admin', role: 'admin' };

const USER_TOKEN  = JWTUtil.signAccess({ sub: PLAIN_USER._id, nickname: PLAIN_USER.nickname, role: 'user' });
const ADMIN_TOKEN = JWTUtil.signAccess({ sub: ADMIN_USER._id, nickname: ADMIN_USER.nickname, role: 'admin' });

const STORE_CODE      = 'secret-store-code';
const STORE_CODE_HASH = crypto.createHash('sha256').update(STORE_CODE).digest('hex');

const STORE = {
  _id:       'store-uuid-001',
  name:      'Coffee Corner',
  code_hash: STORE_CODE_HASH,
};

const STAMP = {
  _id:         'stamp-uuid-001',
  store_id:    STORE._id,
  store_name:  STORE.name,
  achieved_at: new Date('2026-07-11T10:00:00Z'),
};

const STAMP_USER = {
  _id:             PLAIN_USER._id,
  stamp_collected: [STAMP],
  is_exchanged:    false,
};

afterEach(() => jest.clearAllMocks());

// =============================================================================
// POST /v1/stampstore/createstamp
// =============================================================================
describe('POST /v1/stampstore/createstamp', () => {

  test('200 — valid code, first stamp → new stamp returned', async () => {
    UserModel.findById   = jest.fn().mockReturnValue({ lean: () => Promise.resolve(PLAIN_USER) });
    StoreModel.findOne   = jest.fn().mockReturnValue({ lean: () => Promise.resolve(STORE) });
    StampUserModel.findOne = jest.fn().mockReturnValue({ lean: () => Promise.resolve(null) }); // no existing stamps
    StampUserModel.findOneAndUpdate = jest.fn().mockResolvedValue({});

    const res = await request(app)
      .post('/v1/stampstore/createstamp')
      .set('Authorization', `Bearer ${USER_TOKEN}`)
      .send({ code: STORE_CODE });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.store_id).toBe(STORE._id);
    expect(res.body.data._id).toBeDefined();
    expect(res.body.data.store_name).toBeUndefined();

    // Must look up store by SHA-256 hash of the submitted code
    const [storeQuery] = StoreModel.findOne.mock.calls[0];
    expect(storeQuery.code_hash).toBe(STORE_CODE_HASH);

    // Must upsert into StampUser with $push
    const [filter, update, opts] = StampUserModel.findOneAndUpdate.mock.calls[0];
    expect(filter._id).toBe(PLAIN_USER._id);
    expect(update.$push.stamp_collected).toMatchObject({ store_id: STORE._id });
    expect(update.$push.stamp_collected.store_name).toBeUndefined();
    expect(opts.upsert).toBe(true);
  });

  test('200 — duplicate stamp → returns existing stamp without writing to DB', async () => {
    UserModel.findById   = jest.fn().mockReturnValue({ lean: () => Promise.resolve(PLAIN_USER) });
    StoreModel.findOne   = jest.fn().mockReturnValue({ lean: () => Promise.resolve(STORE) });
    StampUserModel.findOne = jest.fn().mockReturnValue({ lean: () => Promise.resolve(STAMP_USER) }); // already has stamp
    StampUserModel.findOneAndUpdate = jest.fn();

    const res = await request(app)
      .post('/v1/stampstore/createstamp')
      .set('Authorization', `Bearer ${USER_TOKEN}`)
      .send({ code: STORE_CODE });

    expect(res.status).toBe(200);
    expect(res.body.data.store_id).toBe(STORE._id);
    expect(StampUserModel.findOneAndUpdate).not.toHaveBeenCalled(); // idempotent — no write
  });

  test('404 STORE_NOT_FOUND — wrong code', async () => {
    UserModel.findById = jest.fn().mockReturnValue({ lean: () => Promise.resolve(PLAIN_USER) });
    StoreModel.findOne = jest.fn().mockReturnValue({ lean: () => Promise.resolve(null) });

    const res = await request(app)
      .post('/v1/stampstore/createstamp')
      .set('Authorization', `Bearer ${USER_TOKEN}`)
      .send({ code: 'wrong-code' });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('STORE_NOT_FOUND');
    expect(StampUserModel.findById).not.toHaveBeenCalled();
  });

  test('400 VALIDATION_ERROR — code missing', async () => {
    UserModel.findById = jest.fn().mockReturnValue({ lean: () => Promise.resolve(PLAIN_USER) });

    const res = await request(app)
      .post('/v1/stampstore/createstamp')
      .set('Authorization', `Bearer ${USER_TOKEN}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(StoreModel.findOne).not.toHaveBeenCalled();
  });

  test('401 — no token', async () => {
    const res = await request(app)
      .post('/v1/stampstore/createstamp')
      .send({ code: STORE_CODE });

    expect(res.status).toBe(401);
  });
});

// =============================================================================
// PATCH /v1/admin/stampstore/markexchanged
// =============================================================================
describe('PATCH /v1/admin/stampstore/markexchanged', () => {

  const EXCHANGED_STAMP_USER = { ...STAMP_USER, is_exchanged: true };

  test('200 — marks is_exchanged = true', async () => {
    UserModel.findById = jest.fn().mockReturnValue({ lean: () => Promise.resolve(ADMIN_USER) });
    StampUserModel.findOne = jest.fn().mockReturnValue({ lean: () => Promise.resolve(STAMP_USER) });
    StampUserModel.findOneAndUpdate = jest.fn().mockReturnValue({ lean: () => Promise.resolve(EXCHANGED_STAMP_USER) });

    const res = await request(app)
      .patch('/v1/admin/stampstore/markexchanged')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ user_id: PLAIN_USER._id });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.is_exchanged).toBe(true);

    const [filter, update, opts] = StampUserModel.findOneAndUpdate.mock.calls[0];
    expect(filter._id).toBe(PLAIN_USER._id);
    expect(update.$set.is_exchanged).toBe(true);
    expect(opts.new).toBe(true);
  });

  test('404 NOT_FOUND — user has no StampUser record', async () => {
    UserModel.findById = jest.fn().mockReturnValue({ lean: () => Promise.resolve(ADMIN_USER) });
    StampUserModel.findOne = jest.fn().mockReturnValue({ lean: () => Promise.resolve(null) });

    const res = await request(app)
      .patch('/v1/admin/stampstore/markexchanged')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ user_id: 'ghost-user-id' });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(StampUserModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  test('400 VALIDATION_ERROR — user_id missing', async () => {
    UserModel.findById = jest.fn().mockReturnValue({ lean: () => Promise.resolve(ADMIN_USER) });

    const res = await request(app)
      .patch('/v1/admin/stampstore/markexchanged')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(StampUserModel.findById).not.toHaveBeenCalled();
  });

  test('403 — non-admin is rejected', async () => {
    UserModel.findById = jest.fn().mockReturnValue({ lean: () => Promise.resolve(PLAIN_USER) });

    const res = await request(app)
      .patch('/v1/admin/stampstore/markexchanged')
      .set('Authorization', `Bearer ${USER_TOKEN}`)
      .send({ user_id: PLAIN_USER._id });

    expect(res.status).toBe(403);
    expect(StampUserModel.findById).not.toHaveBeenCalled();
  });

  test('401 — no token', async () => {
    const res = await request(app)
      .patch('/v1/admin/stampstore/markexchanged')
      .send({ user_id: PLAIN_USER._id });

    expect(res.status).toBe(401);
  });
});
