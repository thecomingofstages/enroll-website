/**
 * tests/registration.test.js
 *
 * Tests for:
 *   GET /v1/registrations/:id
 *
 * Mocks: UserModel, RegistrationModel, ActivityModel
 */

const request = require('supertest');

jest.mock('../src/app/models/User.model');
jest.mock('../src/app/models/Registration.model');
jest.mock('../src/app/models/Activity.model');

const UserModel         = require('../src/app/models/User.model');
const RegistrationModel = require('../src/app/models/Registration.model');
const ActivityModel     = require('../src/app/models/Activity.model');

const buildApp = require('./helpers/app');
const JWTUtil  = require('../src/app/utils/JWT.util');

const app = buildApp();

const OWNER_USER = {
  _id: 'user-owner-uuid',
  nickname: 'OwnerUser',
  interests: ['improv'],
  role: 'user',
};

const OTHER_USER = {
  _id: 'user-other-uuid',
  nickname: 'OtherUser',
  interests: ['drama'],
  role: 'user',
};

const ADMIN_USER = {
  _id: 'admin-uuid',
  nickname: 'AdminUser',
  interests: [],
  role: 'admin',
};

const OWNER_TOKEN = JWTUtil.signAccess({ sub: OWNER_USER._id, nickname: OWNER_USER.nickname, role: OWNER_USER.role });
const OTHER_TOKEN = JWTUtil.signAccess({ sub: OTHER_USER._id, nickname: OTHER_USER.nickname, role: OTHER_USER.role });
const ADMIN_TOKEN = JWTUtil.signAccess({ sub: ADMIN_USER._id, nickname: ADMIN_USER.nickname, role: ADMIN_USER.role });

const REGISTRATION_ID = 'registration-uuid-001';
const REGISTRATION = {
  _id: REGISTRATION_ID,
  user_id: OWNER_USER._id,
  activity_id: 'activity-uuid-001',
  status: 'PAID',
  registered_at: new Date().toISOString(),
};

const ACTIVITY = {
  _id: 'activity-uuid-001',
  name: 'Improv Workshop',
  description: 'Fun improv session',
  hero_image_url: 'https://cdn.example.com/image.jpg',
  price: 300,
  schedule: [{ date: '2026-08-01', venue: 'Studio A' }],
};

function mockAuth(user) {
  UserModel.findById = jest.fn().mockReturnValue({ lean: () => Promise.resolve(user) });
}

afterEach(() => jest.clearAllMocks());

describe('GET /v1/registrations/:id', () => {
  test('200 — owner can fetch own registration with activity details', async () => {
    mockAuth(OWNER_USER);
    RegistrationModel.findById = jest.fn().mockReturnValue({ lean: () => Promise.resolve(REGISTRATION) });
    ActivityModel.findById = jest.fn().mockReturnValue({ select: () => ({ lean: () => Promise.resolve(ACTIVITY) }) });

    const res = await request(app)
      .get(`/v1/registrations/${REGISTRATION_ID}`)
      .set('Authorization', `Bearer ${OWNER_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe(REGISTRATION_ID);
    expect(res.body.data.user_id).toBe(OWNER_USER._id);
    expect(res.body.data.activity).toEqual(ACTIVITY);
  });

  test('403 — non-owner user cannot fetch another user\'s registration', async () => {
    mockAuth(OTHER_USER);
    RegistrationModel.findById = jest.fn().mockReturnValue({ lean: () => Promise.resolve(REGISTRATION) });

    const res = await request(app)
      .get(`/v1/registrations/${REGISTRATION_ID}`)
      .set('Authorization', `Bearer ${OTHER_TOKEN}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  test('200 — admin can fetch any registration', async () => {
    mockAuth(ADMIN_USER);
    RegistrationModel.findById = jest.fn().mockReturnValue({ lean: () => Promise.resolve(REGISTRATION) });
    ActivityModel.findById = jest.fn().mockReturnValue({ select: () => ({ lean: () => Promise.resolve(ACTIVITY) }) });

    const res = await request(app)
      .get(`/v1/registrations/${REGISTRATION_ID}`)
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe(REGISTRATION_ID);
    expect(res.body.data.activity).toEqual(ACTIVITY);
  });

  test('404 — registration not found returns NOT_FOUND', async () => {
    mockAuth(OWNER_USER);
    RegistrationModel.findById = jest.fn().mockReturnValue({ lean: () => Promise.resolve(null) });

    const res = await request(app)
      .get('/v1/registrations/unknown-id')
      .set('Authorization', `Bearer ${OWNER_TOKEN}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
