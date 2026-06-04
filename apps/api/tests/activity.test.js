/**
 * tests/activity.test.js
 *
 * Tests for:
 *   GET /v1/activities
 *   GET /v1/activities/recommended
 *   GET /v1/activities/:id
 *
 * Mocks: UserModel, ActivityModel, SpeakerModel
 */

const request = require('supertest');

jest.mock('../src/app/models/User.model');
jest.mock('../src/app/models/Activity.model');
jest.mock('../src/app/models/Speaker.model');

const UserModel      = require('../src/app/models/User.model');
const ActivityModel  = require('../src/app/models/Activity.model');
const SpeakerModel   = require('../src/app/models/Speaker.model');

const buildApp = require('./helpers/app');
const JWTUtil  = require('../src/app/utils/JWT.util');

const app = buildApp();

const PLAIN_USER = {
  _id: 'user-uuid-001',
  nickname: 'TestUser',
  interests: ['improv', 'drama'],
  role: 'user',
};

const VALID_TOKEN = JWTUtil.signAccess({ sub: PLAIN_USER._id, nickname: PLAIN_USER.nickname, role: PLAIN_USER.role });

const ACTIVITY_LIST = [
  {
    _id: 'activity-uuid-001',
    name: 'Improv Workshop',
    tags: ['improv'],
    is_featured: true,
    created_at: new Date().toISOString(),
    open_registration_at: null,
    close_registration_at: null,
  },
  {
    _id: 'activity-uuid-002',
    name: 'Drama Studio',
    tags: ['drama'],
    is_featured: false,
    created_at: new Date().toISOString(),
    open_registration_at: null,
    close_registration_at: null,
  },
];

const ACTIVITY_DETAIL = {
  _id: 'activity-uuid-001',
  name: 'Improv Workshop',
  tags: ['improv'],
  is_featured: true,
  created_at: new Date().toISOString(),
  open_registration_at: null,
  close_registration_at: null,
};

const SPEAKERS = [
  { _id: 'speaker-uuid-001', activity_id: ACTIVITY_DETAIL._id, name: 'Teacher One' },
];

function createFindChain(result) {
  return {
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(result),
  };
}

function mockAuth(user) {
  UserModel.findById = jest.fn().mockReturnValue({ lean: () => Promise.resolve(user) });
}

afterEach(() => jest.clearAllMocks());

// =============================================================================
// GET /v1/activities
// =============================================================================
describe('GET /v1/activities', () => {
  test('200 — returns paginated activities with is_registration_open', async () => {
    ActivityModel.countDocuments = jest.fn().mockResolvedValue(ACTIVITY_LIST.length);
    ActivityModel.find = jest.fn().mockReturnValue(createFindChain(ACTIVITY_LIST));

    const res = await request(app)
      .get('/v1/activities')
      .query({ page: 1, limit: 10 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta).toEqual({ page: 1, limit: 10, total: 2 });
    expect(ActivityModel.find).toHaveBeenCalledWith({ deleted_at: { $exists: false } });
    expect(res.body.data[0]).toHaveProperty('is_registration_open');
  });

  test('200 — filters by tags and is_featured', async () => {
    ActivityModel.countDocuments = jest.fn().mockResolvedValue(1);
    ActivityModel.find = jest.fn().mockReturnValue(createFindChain([ACTIVITY_LIST[0]]));

    const res = await request(app)
      .get('/v1/activities')
      .query({ tags: 'improv,drama', is_featured: 'true', page: 1, limit: 5 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(ActivityModel.find).toHaveBeenCalledWith({
      deleted_at: { $exists: false },
      tags: { $in: ['improv', 'drama'] },
      is_featured: true,
    });
    expect(res.body.data[0]._id).toBe(ACTIVITY_LIST[0]._id);
  });
});

// =============================================================================
// GET /v1/activities/recommended
// =============================================================================
describe('GET /v1/activities/recommended', () => {
  test('200 — returns recommended activities for authenticated user', async () => {
    mockAuth(PLAIN_USER);
    ActivityModel.find = jest.fn().mockReturnValue(createFindChain([ACTIVITY_LIST[0]]));

    const res = await request(app)
      .get('/v1/activities/recommended')
      .set('Authorization', `Bearer ${VALID_TOKEN}`)
      .query({ limit: 5 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(ActivityModel.find).toHaveBeenCalledWith({
      deleted_at: { $exists: false },
      tags: { $in: PLAIN_USER.interests },
    });
    expect(res.body.data[0]._id).toBe(ACTIVITY_LIST[0]._id);
  });
});

// =============================================================================
// GET /v1/activities/:id
// =============================================================================
describe('GET /v1/activities/:id', () => {
  test('200 — returns activity with speakers', async () => {
    ActivityModel.findOne = jest.fn().mockReturnValue({ lean: () => Promise.resolve(ACTIVITY_DETAIL) });
    SpeakerModel.find = jest.fn().mockReturnValue({ lean: () => Promise.resolve(SPEAKERS) });

    const res = await request(app)
      .get(`/v1/activities/${ACTIVITY_DETAIL._id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe(ACTIVITY_DETAIL._id);
    expect(res.body.data.speakers).toEqual(SPEAKERS);
    expect(res.body.data).toHaveProperty('is_registration_open');
  });

  test('404 — activity not found returns NOT_FOUND', async () => {
    ActivityModel.findOne = jest.fn().mockReturnValue({ lean: () => Promise.resolve(null) });

    const res = await request(app)
      .get('/v1/activities/unknown-id');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
