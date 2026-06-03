/**
 * tests/admin.registration.test.js
 *
 * Tests for GET /v1/admin/registrations.
 *
 * Mocks: UserModel, RegistrationModel
 */

const request = require('supertest');

jest.mock('../src/app/models/User.model');
jest.mock('../src/app/models/Registration.model');

const UserModel         = require('../src/app/models/User.model');
const RegistrationModel = require('../src/app/models/Registration.model');

const buildApp = require('./helpers/app');
const JWTUtil  = require('../src/app/utils/JWT.util');

const app = buildApp();

const ADMIN_USER = { _id: 'admin-uuid-001', nickname: 'Admin', role: 'admin' };
const PLAIN_USER = { _id: 'user-uuid-001', nickname: 'User', role: 'user' };

const ADMIN_TOKEN = JWTUtil.signAccess({ sub: ADMIN_USER._id, nickname: ADMIN_USER.nickname, role: 'admin' });
const USER_TOKEN  = JWTUtil.signAccess({ sub: PLAIN_USER._id, nickname: PLAIN_USER.nickname, role: 'user' });

function mockAuth(user) {
  UserModel.findById = jest.fn().mockReturnValue({ lean: () => Promise.resolve(user) });
}

afterEach(() => jest.clearAllMocks());

describe('GET /v1/admin/registrations', () => {
  test('200 — returns paginated registration list with meta and data', async () => {
    mockAuth(ADMIN_USER);

    const registrations = [
      {
        _id: 'reg-uuid-001',
        user_id: { _id: 'user-uuid-001', nickname: 'User' },
        activity_id: { _id: 'activity-uuid-001', name: 'Improv Workshop', price: 500 },
        status: 'PENDING',
        group_name: null,
        registered_at: '2026-06-03T00:00:00.000Z',
        custom_answers: [],
      },
    ];

    const queryChain = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(registrations),
    };

    RegistrationModel.countDocuments = jest.fn().mockResolvedValue(1);
    RegistrationModel.find = jest.fn().mockReturnValue(queryChain);

    const res = await request(app)
      .get('/v1/admin/registrations')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .query({ page: 1, limit: 20 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.meta).toEqual({ page: 1, limit: 20, total: 1 });
    expect(res.body.data).toEqual(registrations);

    expect(RegistrationModel.countDocuments).toHaveBeenCalledWith({});
    expect(RegistrationModel.find).toHaveBeenCalledWith({});
    expect(queryChain.sort).toHaveBeenCalledWith({ registered_at: -1 });
    expect(queryChain.skip).toHaveBeenCalledWith(0);
    expect(queryChain.limit).toHaveBeenCalledWith(20);
    expect(queryChain.populate).toHaveBeenCalledTimes(2);
  });

  test('200 — applies activity_id and status filters when provided', async () => {
    mockAuth(ADMIN_USER);

    const registrations = [];
    const queryChain = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(registrations),
    };

    RegistrationModel.countDocuments = jest.fn().mockResolvedValue(0);
    RegistrationModel.find = jest.fn().mockReturnValue(queryChain);

    const res = await request(app)
      .get('/v1/admin/registrations')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .query({ activity_id: 'activity-uuid-001', status: 'PAID', page: 3, limit: 5 });

    expect(res.status).toBe(200);
    expect(res.body.meta).toEqual({ page: 3, limit: 5, total: 0 });
    expect(RegistrationModel.countDocuments).toHaveBeenCalledWith({ activity_id: 'activity-uuid-001', status: 'PAID' });
    expect(RegistrationModel.find).toHaveBeenCalledWith({ activity_id: 'activity-uuid-001', status: 'PAID' });
    expect(queryChain.skip).toHaveBeenCalledWith(10);
    expect(queryChain.limit).toHaveBeenCalledWith(5);
  });

  test('403 — non-admin token returns FORBIDDEN and does not query registrations', async () => {
    mockAuth(PLAIN_USER);
    RegistrationModel.countDocuments = jest.fn();
    RegistrationModel.find = jest.fn();

    const res = await request(app)
      .get('/v1/admin/registrations')
      .set('Authorization', `Bearer ${USER_TOKEN}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(RegistrationModel.countDocuments).not.toHaveBeenCalled();
    expect(RegistrationModel.find).not.toHaveBeenCalled();
  });

  test('401 — missing token returns TOKEN_MISSING', async () => {
    const res = await request(app)
      .get('/v1/admin/registrations');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_MISSING');
  });
});
