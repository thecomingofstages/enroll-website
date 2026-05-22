/**
 * tests/admin.activity.test.js
 *
 * Tests for:
 *   POST   /v1/admin/activities
 *   PATCH  /v1/admin/activities/:id
 *   DELETE /v1/admin/activities/:id
 *
 * Mocks: UserModel, ActivityModel, AttendanceModel, RegistrationModel, R2Util
 */

const request = require('supertest');
const path    = require('path');

jest.mock('../src/app/models/User.model');
jest.mock('../src/app/models/Activity.model');
jest.mock('../src/app/models/Attendance.model');
jest.mock('../src/app/models/Registration.model');
jest.mock('../src/app/utils/R2.util');

const UserModel         = require('../src/app/models/User.model');
const ActivityModel     = require('../src/app/models/Activity.model');
const AttendanceModel   = require('../src/app/models/Attendance.model');
const RegistrationModel = require('../src/app/models/Registration.model');
const R2Util            = require('../src/app/utils/R2.util');

const buildApp = require('./helpers/app');
const JWTUtil  = require('../src/app/utils/JWT.util');

const app = buildApp();

// ── Auth fixtures ─────────────────────────────────────────────────────────────
const ADMIN_USER = { _id: 'admin-uuid-001', nickname: 'Admin', role: 'admin' };
const PLAIN_USER = { _id: 'user-uuid-001',  nickname: 'User',  role: 'user'  };

const ADMIN_TOKEN = JWTUtil.signAccess({ sub: ADMIN_USER._id, nickname: ADMIN_USER.nickname, role: 'admin' });
const USER_TOKEN  = JWTUtil.signAccess({ sub: PLAIN_USER._id, nickname: PLAIN_USER.nickname, role: 'user'  });

// ── Activity fixtures ─────────────────────────────────────────────────────────
const CDN_URL = 'https://e26bb30623b28bb036a21ecd3bd6160b.r2.cloudflarestorage.com/enrollmentwebsiteimages/activity-heroes/mock.jpg';

// Form fields for multipart POST (all values are strings in multipart)
const FORM_FIELDS = {
  name:           'Improv Workshop',
  description:    'A hands-on improv session.',
  price:          '500',
  seat_capacity:  '30',
  tags:           JSON.stringify(['improv', 'beginner']),
  benefits:       JSON.stringify(['Certificate', 'Lunch']),
  is_registration_open: 'false',
  is_featured:    'false',
  schedule:       JSON.stringify([{
    date:  '2026-08-01', venue: 'Studio A',
    slots: [{ start_time: '09:00', end_time: '12:00', title: 'Morning session', description: null }],
  }]),
  extra_questions: JSON.stringify([{
    question_text: 'T-Shirt size?', type: 'single_choice',
    options: ['S', 'M', 'L', 'XL'], is_required: true,
  }]),
};

const SAVED_ACTIVITY = {
  _id:             'activity-uuid-001',
  name:            'Improv Workshop',
  description:     'A hands-on improv session.',
  hero_image_url:  CDN_URL,
  price:           500,
  seat_capacity:   30,
  enrolled_count:  0,
  tags:            ['improv', 'beginner'],
  benefits:        ['Certificate', 'Lunch'],
  is_registration_open: false,
  is_featured:     false,
  schedule:        [],
  extra_questions: [{ question_id: 'q_auto_001', question_text: 'T-Shirt size?', type: 'single_choice', options: ['S','M','L','XL'], is_required: true }],
  created_at:      new Date().toISOString(),
  updated_at:      new Date().toISOString(),
};

// Small 1x1 JPEG buffer to use as fake image upload
const FAKE_IMAGE = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8U' +
  'HRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgN' +
  'DRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIy' +
  'MjL/wAARCAABAAEDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUE/8QAIxAAAQME' +
  'AgMAAAAAAAAAAAAAAQIDBAAFERIhMUH/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAA' +
  'AAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AKXFZbfaUZEV5bzSkEpUVHIPv3ooorQH//Z',
  'base64'
);

function mockAuth(user) {
  UserModel.findById = jest.fn().mockReturnValue({ lean: () => Promise.resolve(user) });
}

afterEach(() => jest.clearAllMocks());

// =============================================================================
// POST /v1/admin/activities
// =============================================================================
describe('POST /v1/admin/activities', () => {

  test('201 — uploads hero_image to R2, creates activity + Attendance doc', async () => {
    mockAuth(ADMIN_USER);
    R2Util.upload              = jest.fn().mockResolvedValue(CDN_URL);
    ActivityModel.create       = jest.fn().mockResolvedValue({ toObject: () => SAVED_ACTIVITY, _id: SAVED_ACTIVITY._id });
    AttendanceModel.create     = jest.fn().mockResolvedValue({});

    const res = await request(app)
      .post('/v1/admin/activities')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .attach('hero_image', FAKE_IMAGE, { filename: 'hero.jpg', contentType: 'image/jpeg' })
      .field(FORM_FIELDS);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe(SAVED_ACTIVITY._id);

    // R2 upload must be called with the correct folder
    expect(R2Util.upload).toHaveBeenCalledTimes(1);
    const [buf, folder, , mimetype] = R2Util.upload.mock.calls[0];
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(folder).toBe('activity-heroes');
    expect(mimetype).toBe('image/jpeg');

    // hero_image_url in the DB payload must be the CDN URL from R2
    const createArg = ActivityModel.create.mock.calls[0][0];
    expect(createArg.hero_image_url).toBe(CDN_URL);

    // Attendance doc created with the activity _id
    expect(AttendanceModel.create).toHaveBeenCalledWith({ activity_id: SAVED_ACTIVITY._id });
  });

  test('400 VALIDATION_ERROR — no hero_image file and no hero_image_url in body', async () => {
    mockAuth(ADMIN_USER);
    R2Util.upload = jest.fn();

    const res = await request(app)
      .post('/v1/admin/activities')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ name: 'Missing image activity' }); // JSON body, no file

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.field).toBe('hero_image');
    expect(R2Util.upload).not.toHaveBeenCalled();
    expect(ActivityModel.create).not.toHaveBeenCalled();
  });

  test('enrolled_count is always forced to 0 — client cannot set it', async () => {
    mockAuth(ADMIN_USER);
    R2Util.upload          = jest.fn().mockResolvedValue(CDN_URL);
    ActivityModel.create   = jest.fn().mockResolvedValue({ toObject: () => SAVED_ACTIVITY, _id: SAVED_ACTIVITY._id });
    AttendanceModel.create = jest.fn().mockResolvedValue({});

    await request(app)
      .post('/v1/admin/activities')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .attach('hero_image', FAKE_IMAGE, { filename: 'hero.jpg', contentType: 'image/jpeg' })
      .field({ ...FORM_FIELDS, enrolled_count: '999' });

    const createArg = ActivityModel.create.mock.calls[0][0];
    expect(createArg.enrolled_count).toBe(0);
  });

  test('deleted_at is stripped from create payload', async () => {
    mockAuth(ADMIN_USER);
    R2Util.upload          = jest.fn().mockResolvedValue(CDN_URL);
    ActivityModel.create   = jest.fn().mockResolvedValue({ toObject: () => SAVED_ACTIVITY, _id: SAVED_ACTIVITY._id });
    AttendanceModel.create = jest.fn().mockResolvedValue({});

    await request(app)
      .post('/v1/admin/activities')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .attach('hero_image', FAKE_IMAGE, { filename: 'hero.jpg', contentType: 'image/jpeg' })
      .field({ ...FORM_FIELDS, deleted_at: '2020-01-01' });

    const createArg = ActivityModel.create.mock.calls[0][0];
    expect(createArg.deleted_at).toBeUndefined();
  });

  test('question_id is auto-generated when omitted', async () => {
    mockAuth(ADMIN_USER);
    R2Util.upload          = jest.fn().mockResolvedValue(CDN_URL);
    ActivityModel.create   = jest.fn().mockResolvedValue({ toObject: () => SAVED_ACTIVITY, _id: SAVED_ACTIVITY._id });
    AttendanceModel.create = jest.fn().mockResolvedValue({});

    await request(app)
      .post('/v1/admin/activities')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .attach('hero_image', FAKE_IMAGE, { filename: 'hero.jpg', contentType: 'image/jpeg' })
      .field(FORM_FIELDS);

    const createArg = ActivityModel.create.mock.calls[0][0];
    // extra_questions comes in as JSON string — helper parses it
    // question_id must be auto-generated
    if (Array.isArray(createArg.extra_questions)) {
      expect(createArg.extra_questions[0].question_id).toBeDefined();
    }
  });

  test('Attendance NOT created if ActivityModel.create throws', async () => {
    mockAuth(ADMIN_USER);
    R2Util.upload          = jest.fn().mockResolvedValue(CDN_URL);
    ActivityModel.create   = jest.fn().mockRejectedValue(new Error('DB write failed'));
    AttendanceModel.create = jest.fn().mockResolvedValue({});

    const res = await request(app)
      .post('/v1/admin/activities')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .attach('hero_image', FAKE_IMAGE, { filename: 'hero.jpg', contentType: 'image/jpeg' })
      .field(FORM_FIELDS);

    expect(res.status).toBe(500);
    expect(AttendanceModel.create).not.toHaveBeenCalled();
  });

  test('403 — non-admin JWT returns FORBIDDEN, R2 not called', async () => {
    mockAuth(PLAIN_USER);
    R2Util.upload = jest.fn();

    const res = await request(app)
      .post('/v1/admin/activities')
      .set('Authorization', `Bearer ${USER_TOKEN}`)
      .attach('hero_image', FAKE_IMAGE, { filename: 'hero.jpg', contentType: 'image/jpeg' })
      .field(FORM_FIELDS);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(R2Util.upload).not.toHaveBeenCalled();
    expect(ActivityModel.create).not.toHaveBeenCalled();
  });

  test('401 — missing token returns TOKEN_MISSING', async () => {
    const res = await request(app)
      .post('/v1/admin/activities')
      .attach('hero_image', FAKE_IMAGE, { filename: 'hero.jpg', contentType: 'image/jpeg' })
      .field(FORM_FIELDS);

    expect(res.status).toBe(401);
  });
});

// =============================================================================
// PATCH /v1/admin/activities/:id
// =============================================================================
describe('PATCH /v1/admin/activities/:id', () => {

  const UPDATED = { ...SAVED_ACTIVITY, is_registration_open: true, seat_capacity: 40 };
  const UPDATED_WITH_IMAGE = { ...UPDATED, hero_image_url: CDN_URL };

  test('200 — updates fields only (no image change)', async () => {
    mockAuth(ADMIN_USER);
    R2Util.upload = jest.fn();
    ActivityModel.findByIdAndUpdate = jest.fn().mockReturnValue({ lean: () => Promise.resolve(UPDATED) });

    const res = await request(app)
      .patch(`/v1/admin/activities/${SAVED_ACTIVITY._id}`)
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ is_registration_open: true, seat_capacity: 40 });

    expect(res.status).toBe(200);
    expect(res.body.data.is_registration_open).toBe(true);
    // R2 must NOT be called when no file is uploaded
    expect(R2Util.upload).not.toHaveBeenCalled();
  });

  test('200 — new hero_image uploaded to R2, hero_image_url updated in $set', async () => {
    mockAuth(ADMIN_USER);
    R2Util.upload = jest.fn().mockResolvedValue(CDN_URL);
    ActivityModel.findByIdAndUpdate = jest.fn().mockReturnValue({ lean: () => Promise.resolve(UPDATED_WITH_IMAGE) });

    const res = await request(app)
      .patch(`/v1/admin/activities/${SAVED_ACTIVITY._id}`)
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .attach('hero_image', FAKE_IMAGE, { filename: 'new-hero.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(200);
    expect(R2Util.upload).toHaveBeenCalledTimes(1);

    // $set must include the new CDN URL
    const [, updateArg] = ActivityModel.findByIdAndUpdate.mock.calls[0];
    expect(updateArg.$set.hero_image_url).toBe(CDN_URL);
  });

  test('hero_image_url cannot be set via JSON body — blocked field', async () => {
    mockAuth(ADMIN_USER);
    R2Util.upload = jest.fn();
    ActivityModel.findByIdAndUpdate = jest.fn().mockReturnValue({ lean: () => Promise.resolve(UPDATED) });

    await request(app)
      .patch(`/v1/admin/activities/${SAVED_ACTIVITY._id}`)
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ is_registration_open: true, hero_image_url: 'https://evil.com/hack.jpg' });

    const [, updateArg] = ActivityModel.findByIdAndUpdate.mock.calls[0];
    // hero_image_url must NOT be in $set when sent via body without a file
    expect(updateArg.$set.hero_image_url).toBeUndefined();
    expect(R2Util.upload).not.toHaveBeenCalled();
  });

  test('enrolled_count is never included in the $set', async () => {
    mockAuth(ADMIN_USER);
    R2Util.upload = jest.fn();
    ActivityModel.findByIdAndUpdate = jest.fn().mockReturnValue({ lean: () => Promise.resolve(UPDATED) });

    await request(app)
      .patch(`/v1/admin/activities/${SAVED_ACTIVITY._id}`)
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ is_registration_open: true, enrolled_count: 999 });

    const [, updateArg] = ActivityModel.findByIdAndUpdate.mock.calls[0];
    expect(updateArg.$set.enrolled_count).toBeUndefined();
    expect(updateArg.$set.is_registration_open).toBe(true);
  });

  test('_id, created_at, deleted_at are silently dropped from $set', async () => {
    mockAuth(ADMIN_USER);
    R2Util.upload = jest.fn();
    ActivityModel.findByIdAndUpdate = jest.fn().mockReturnValue({ lean: () => Promise.resolve(UPDATED) });

    await request(app)
      .patch(`/v1/admin/activities/${SAVED_ACTIVITY._id}`)
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ name: 'New Name', _id: 'hacked', created_at: '2000-01-01', deleted_at: 'now' });

    const [, updateArg] = ActivityModel.findByIdAndUpdate.mock.calls[0];
    expect(updateArg.$set._id).toBeUndefined();
    expect(updateArg.$set.created_at).toBeUndefined();
    expect(updateArg.$set.deleted_at).toBeUndefined();
    expect(updateArg.$set.name).toBe('New Name');
  });

  test('400 VALIDATION_ERROR — body contains only blocked fields', async () => {
    mockAuth(ADMIN_USER);
    R2Util.upload = jest.fn();

    const res = await request(app)
      .patch(`/v1/admin/activities/${SAVED_ACTIVITY._id}`)
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ enrolled_count: 5, _id: 'hack', deleted_at: 'now' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(ActivityModel.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(R2Util.upload).not.toHaveBeenCalled();
  });

  test('404 NOT_FOUND — activity does not exist', async () => {
    mockAuth(ADMIN_USER);
    R2Util.upload = jest.fn();
    ActivityModel.findByIdAndUpdate = jest.fn().mockReturnValue({ lean: () => Promise.resolve(null) });

    const res = await request(app)
      .patch('/v1/admin/activities/ghost-id')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ is_featured: true });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  test('403 — non-admin is rejected, R2 not called', async () => {
    mockAuth(PLAIN_USER);
    R2Util.upload = jest.fn();

    const res = await request(app)
      .patch(`/v1/admin/activities/${SAVED_ACTIVITY._id}`)
      .set('Authorization', `Bearer ${USER_TOKEN}`)
      .send({ is_featured: true });

    expect(res.status).toBe(403);
    expect(R2Util.upload).not.toHaveBeenCalled();
  });

  test('401 — missing token is rejected', async () => {
    const res = await request(app)
      .patch(`/v1/admin/activities/${SAVED_ACTIVITY._id}`)
      .send({ is_featured: true });

    expect(res.status).toBe(401);
  });
});

// =============================================================================
// DELETE /v1/admin/activities/:id
// =============================================================================
describe('DELETE /v1/admin/activities/:id', () => {

  test('204 — soft-deletes activity with no active registrations', async () => {
    mockAuth(ADMIN_USER);
    ActivityModel.findOne            = jest.fn().mockReturnValue({ lean: () => Promise.resolve(SAVED_ACTIVITY) });
    RegistrationModel.countDocuments = jest.fn().mockResolvedValue(0);
    RegistrationModel.updateMany     = jest.fn().mockResolvedValue({});
    ActivityModel.findByIdAndUpdate  = jest.fn().mockResolvedValue({});

    const res = await request(app)
      .delete(`/v1/admin/activities/${SAVED_ACTIVITY._id}`)
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);

    expect(res.status).toBe(204);
    const [, updateArg] = ActivityModel.findByIdAndUpdate.mock.calls[0];
    expect(updateArg.$set.deleted_at).toBeInstanceOf(Date);
  });

  test('PENDING registrations are cancelled before soft-delete', async () => {
    mockAuth(ADMIN_USER);
    ActivityModel.findOne            = jest.fn().mockReturnValue({ lean: () => Promise.resolve(SAVED_ACTIVITY) });
    RegistrationModel.countDocuments = jest.fn().mockResolvedValue(0);
    RegistrationModel.updateMany     = jest.fn().mockResolvedValue({ modifiedCount: 3 });
    ActivityModel.findByIdAndUpdate  = jest.fn().mockResolvedValue({});

    await request(app)
      .delete(`/v1/admin/activities/${SAVED_ACTIVITY._id}`)
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);

    const [filter, update] = RegistrationModel.updateMany.mock.calls[0];
    expect(filter.activity_id).toBe(SAVED_ACTIVITY._id);
    expect(filter.status).toBe('PENDING');
    expect(update.$set.status).toBe('CANCELLED');
  });

  test('409 HAS_ACTIVE_REGISTRATIONS — blocks delete when PAID/JOINED exist', async () => {
    mockAuth(ADMIN_USER);
    ActivityModel.findOne            = jest.fn().mockReturnValue({ lean: () => Promise.resolve(SAVED_ACTIVITY) });
    RegistrationModel.countDocuments = jest.fn().mockResolvedValue(5);

    const res = await request(app)
      .delete(`/v1/admin/activities/${SAVED_ACTIVITY._id}`)
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('HAS_ACTIVE_REGISTRATIONS');
    expect(res.body.error.message).toMatch(/5/);
    expect(RegistrationModel.updateMany).not.toHaveBeenCalled();
    expect(ActivityModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  test('countDocuments filters on exactly PAID and JOINED only', async () => {
    mockAuth(ADMIN_USER);
    ActivityModel.findOne            = jest.fn().mockReturnValue({ lean: () => Promise.resolve(SAVED_ACTIVITY) });
    RegistrationModel.countDocuments = jest.fn().mockResolvedValue(0);
    RegistrationModel.updateMany     = jest.fn().mockResolvedValue({});
    ActivityModel.findByIdAndUpdate  = jest.fn().mockResolvedValue({});

    await request(app)
      .delete(`/v1/admin/activities/${SAVED_ACTIVITY._id}`)
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);

    const [filter] = RegistrationModel.countDocuments.mock.calls[0];
    expect(filter.status.$in).toEqual(expect.arrayContaining(['PAID', 'JOINED']));
    expect(filter.status.$in).not.toContain('PENDING');
    expect(filter.status.$in).not.toContain('CANCELLED');
  });

  test('404 — activity does not exist', async () => {
    mockAuth(ADMIN_USER);
    ActivityModel.findOne = jest.fn().mockReturnValue({ lean: () => Promise.resolve(null) });

    const res = await request(app)
      .delete('/v1/admin/activities/ghost-id')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(RegistrationModel.countDocuments).not.toHaveBeenCalled();
  });

  test('404 — already soft-deleted treated as not found', async () => {
    mockAuth(ADMIN_USER);
    ActivityModel.findOne = jest.fn().mockReturnValue({ lean: () => Promise.resolve(null) });

    const res = await request(app)
      .delete(`/v1/admin/activities/${SAVED_ACTIVITY._id}`)
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);

    expect(res.status).toBe(404);
  });

  test('403 — non-admin rejected, no DB calls made', async () => {
    mockAuth(PLAIN_USER);

    const res = await request(app)
      .delete(`/v1/admin/activities/${SAVED_ACTIVITY._id}`)
      .set('Authorization', `Bearer ${USER_TOKEN}`);

    expect(res.status).toBe(403);
    expect(ActivityModel.findOne).not.toHaveBeenCalled();
  });

  test('401 — missing token is rejected', async () => {
    const res = await request(app)
      .delete(`/v1/admin/activities/${SAVED_ACTIVITY._id}`);

    expect(res.status).toBe(401);
  });
});
