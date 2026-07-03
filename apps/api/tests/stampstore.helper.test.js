const request = require('supertest');
const crypto = require('crypto');

jest.mock('../../src/app/models/User.model');
jest.mock('../../src/app/models/Store.model');
jest.mock('../../src/app/models/StampUser.model');

const UserModel = require('../../src/app/models/User.model');
const StoreModel = require('../../src/app/models/Store.model');
const StampUserModel = require('../../src/app/models/StampUser.model');

const buildApp = require('./app');
const JWTUtil = require('../../src/app/utils/JWT.util');

const app = buildApp();

const PLAIN_USER = { _id: 'user-uuid-001', nickname: 'Golf', role: 'user' };
const ADMIN_USER = { _id: 'admin-uuid-001', nickname: 'Admin', role: 'admin' };

const USER_TOKEN = JWTUtil.signAccess({ sub: PLAIN_USER._id, nickname: PLAIN_USER.nickname, role: 'user' });
const ADMIN_TOKEN = JWTUtil.signAccess({ sub: ADMIN_USER._id, nickname: ADMIN_USER.nickname, role: 'admin' });

const STORE_CODE = 'secret-store-code';
const STORE_CODE_HASH = crypto.createHash('sha256').update(STORE_CODE).digest('hex');

const STORE_ONE = {
  _id: 'store-uuid-001',
  name: 'Coffee Corner',
  code_hash: STORE_CODE_HASH,
  created_at: new Date('2026-07-01T00:00:00Z'),
};

const STORE_TWO = {
  _id: 'store-uuid-002',
  name: 'Book Nook',
  code_hash: crypto.createHash('sha256').update('another-code').digest('hex'),
  created_at: new Date('2026-07-02T00:00:00Z'),
};

afterEach(() => jest.clearAllMocks());

describe('GET /v1/stampstore', () => {
  test('returns the store list with collected counts', async () => {
    UserModel.findById = jest.fn().mockReturnValue({ lean: () => Promise.resolve(PLAIN_USER) });
    StoreModel.find = jest.fn().mockReturnValue({ lean: () => Promise.resolve([STORE_ONE, STORE_TWO]) });
    StampUserModel.findOne = jest.fn().mockReturnValue({
      lean: () => Promise.resolve({
        _id: PLAIN_USER._id,
        stamp_collected: [{ store_id: STORE_ONE._id }],
      }),
    });

    const res = await request(app)
      .get('/v1/stampstore')
      .set('Authorization', `Bearer ${USER_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([
      { name: STORE_ONE.name, count: 1 },
      { name: STORE_TWO.name, count: 0 },
    ]);
  });
});

describe('POST /v1/admin/stampstore/create', () => {
  test('creates a store with a hashed code', async () => {
    UserModel.findById = jest.fn().mockReturnValue({ lean: () => Promise.resolve(ADMIN_USER) });
    StoreModel.create = jest.fn().mockResolvedValue({
      _id: 'new-store-id',
      name: 'New Store',
      created_at: new Date('2026-07-03T00:00:00Z'),
    });

    const res = await request(app)
      .post('/v1/admin/stampstore/create')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ name: 'New Store', code: STORE_CODE });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      _id: 'new-store-id',
      name: 'New Store',
    });

    expect(StoreModel.create).toHaveBeenCalledWith({
      name: 'New Store',
      code_hash: STORE_CODE_HASH,
    });
  });
});

describe('PATCH /v1/admin/stampstore/changecode', () => {
  test('updates a store code hash', async () => {
    UserModel.findById = jest.fn().mockReturnValue({ lean: () => Promise.resolve(ADMIN_USER) });
    StoreModel.findOneAndUpdate = jest.fn().mockReturnValue({
      lean: () => Promise.resolve({
        _id: STORE_ONE._id,
        name: STORE_ONE.name,
        created_at: STORE_ONE.created_at,
      }),
    });

    const res = await request(app)
      .patch('/v1/admin/stampstore/changecode')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ _id: STORE_ONE._id, new_code: 'new-secret-code' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      _id: STORE_ONE._id,
      name: STORE_ONE.name,
    });

    const [, updatePayload] = StoreModel.findOneAndUpdate.mock.calls[0];
    expect(updatePayload.$set.code_hash).toBe(
      crypto.createHash('sha256').update('new-secret-code').digest('hex')
    );
  });
});
