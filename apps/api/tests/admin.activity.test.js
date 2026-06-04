/**
 * tests/admin.activity.test.js
 *
 * Tests for:
 *   POST   /v1/admin/activities     — JSON body, hero_image_url is a plain string (Google Drive link)
 *   PATCH  /v1/admin/activities/:id
 *   DELETE /v1/admin/activities/:id
 *
 * Mocks: UserModel, ActivityModel, AttendanceModel, RegistrationModel
 * No R2Util — images are plain URL strings now.
 */

const request = require('supertest');

jest.mock('../src/app/models/User.model');
jest.mock('../src/app/models/Activity.model');
jest.mock('../src/app/models/Attendance.model');
jest.mock('../src/app/models/Registration.model');

const UserModel         = require('../src/app/models/User.model');
const ActivityModel     = require('../src/app/models/Activity.model');
const AttendanceModel   = require('../src/app/models/Attendance.model');
const RegistrationModel = require('../src/app/models/Registration.model');

const buildApp = require('./helpers/app');
const JWTUtil  = require('../src/app/utils/JWT.util');

const app = buildApp();

// ── Auth fixtures ─────────────────────────────────────────────────────────────
const ADMIN_USER = { _id: 'admin-uuid-001', nickname: 'Admin', role: 'admin' };
const PLAIN_USER = { _id: 'user-uuid-001',  nickname: 'User',  role: 'user'  };

const ADMIN_TOKEN = JWTUtil.signAccess({ sub: ADMIN_USER._id, nickname: ADMIN_USER.nickname, role: 'admin' });
const USER_TOKEN  = JWTUtil.signAccess({ sub: PLAIN_USER._id, nickname: PLAIN_USER.nickname, role: 'user' });

// ── Fixtures ──────────────────────────────────────────────────────────────────
const GDRIVE_URL = 'https://drive.google.com/uc?export=view&id=skibid67676767';

const VALID_BODY = {
  name:                  'Improv Workshop',
  description:           'A hands-on improv session.',
  hero_image_url:        GDRIVE_URL,
  price:                 500,
  seat_capacity:         30,
  tags:                  ['improv', 'beginner'],
  benefits:              ['Certificate', 'Lunch'],
  is_featured:           false,
  open_registration_at:  null,
  close_registration_at: null,
  schedule: [{
    date: '2026-08-01', venue: 'Studio A',
    slots: [{ start_time: '09:00', end_time: '12:00', title: 'Morning session', description: null }],
  }],
  extra_questions: [{
    question_text: 'T-Shirt size?', type: 'single_choice',
    options: ['S', 'M', 'L', 'XL'], is_required: true,
  }],
};

const SAVED_ACTIVITY = {
  _id:             'activity-uuid-001',
  ...VALID_BODY,
  enrolled_count:  0,
  is_registration_open: false,
  extra_questions: [{ ...VALID_BODY.extra_questions[0], question_id: 'q_auto_001' }],
  created_at:      new Date().toISOString(),
  updated_at:      new Date().toISOString(),
};

function mockAuth(user) {
  UserModel.findById = jest.fn().mockReturnValue({ lean: () => Promise.resolve(user) });
}

afterEach(() => jest.clearAllMocks());

// =============================================================================
// POST /v1/admin/activities
// =============================================================================
describe('POST /v1/admin/activities', () => {

  test('201 — creates activity + Attendance doc, returns full document', async () => {
    mockAuth(ADMIN_USER);
    ActivityModel.create   = jest.fn().mockResolvedValue({ toObject: () => SAVED_ACTIVITY, _id: SAVED_ACTIVITY._id });
    AttendanceModel.create = jest.fn().mockResolvedValue({});

    const res = await request(app)
      .post('/v1/admin/activities')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send(VALID_BODY);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe(SAVED_ACTIVITY._id);
    expect(res.body.data.hero_image_url).toBe(GDRIVE_URL);
    expect(res.body.data.enrolled_count).toBe(0);

    // Attendance doc must be created with the activity _id
    expect(AttendanceModel.create).toHaveBeenCalledTimes(1);
    expect(AttendanceModel.create).toHaveBeenCalledWith({ activity_id: SAVED_ACTIVITY._id });
  });

  test('hero_image_url plain string is passed through unchanged', async () => {
    mockAuth(ADMIN_USER);
    ActivityModel.create   = jest.fn().mockResolvedValue({ toObject: () => SAVED_ACTIVITY, _id: SAVED_ACTIVITY._id });
    AttendanceModel.create = jest.fn().mockResolvedValue({});

    await request(app)
      .post('/v1/admin/activities')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send(VALID_BODY);

    const arg = ActivityModel.create.mock.calls[0][0];
    expect(arg.hero_image_url).toBe(GDRIVE_URL);
  });

  test('400 VALIDATION_ERROR — missing hero_image_url', async () => {
    mockAuth(ADMIN_USER);

    const { hero_image_url, ...withoutImage } = VALID_BODY;
    const res = await request(app)
      .post('/v1/admin/activities')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send(withoutImage);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.field).toBe('hero_image_url');
    expect(ActivityModel.create).not.toHaveBeenCalled();
    expect(AttendanceModel.create).not.toHaveBeenCalled();
  });

  test('enrolled_count is always forced to 0 — client cannot set it', async () => {
    mockAuth(ADMIN_USER);
    ActivityModel.create   = jest.fn().mockResolvedValue({ toObject: () => SAVED_ACTIVITY, _id: SAVED_ACTIVITY._id });
    AttendanceModel.create = jest.fn().mockResolvedValue({});

    await request(app)
      .post('/v1/admin/activities')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ ...VALID_BODY, enrolled_count: 999 });

    const arg = ActivityModel.create.mock.calls[0][0];
    expect(arg.enrolled_count).toBe(0);
  });

  test('deleted_at is stripped from create payload', async () => {
    mockAuth(ADMIN_USER);
    ActivityModel.create   = jest.fn().mockResolvedValue({ toObject: () => SAVED_ACTIVITY, _id: SAVED_ACTIVITY._id });
    AttendanceModel.create = jest.fn().mockResolvedValue({});

    await request(app)
      .post('/v1/admin/activities')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ ...VALID_BODY, deleted_at: '2020-01-01' });

    const arg = ActivityModel.create.mock.calls[0][0];
    expect(arg.deleted_at).toBeUndefined();
  });

  test('question_id is auto-generated when omitted', async () => {
    mockAuth(ADMIN_USER);
    ActivityModel.create   = jest.fn().mockResolvedValue({ toObject: () => SAVED_ACTIVITY, _id: SAVED_ACTIVITY._id });
    AttendanceModel.create = jest.fn().mockResolvedValue({});

    await request(app)
      .post('/v1/admin/activities')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send(VALID_BODY);

    const arg = ActivityModel.create.mock.calls[0][0];
    expect(arg.extra_questions[0].question_id).toBeDefined();
    expect(typeof arg.extra_questions[0].question_id).toBe('string');
  });

  test('client-supplied question_id is preserved', async () => {
    mockAuth(ADMIN_USER);
    ActivityModel.create   = jest.fn().mockResolvedValue({ toObject: () => SAVED_ACTIVITY, _id: SAVED_ACTIVITY._id });
    AttendanceModel.create = jest.fn().mockResolvedValue({});

    await request(app)
      .post('/v1/admin/activities')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({
        ...VALID_BODY,
        extra_questions: [{ ...VALID_BODY.extra_questions[0], question_id: 'q_custom' }],
      });

    const arg = ActivityModel.create.mock.calls[0][0];
    expect(arg.extra_questions[0].question_id).toBe('q_custom');
  });

  test('Attendance NOT created if ActivityModel.create throws', async () => {
    mockAuth(ADMIN_USER);
    ActivityModel.create   = jest.fn().mockRejectedValue(new Error('DB write failed'));
    AttendanceModel.create = jest.fn().mockResolvedValue({});

    const res = await request(app)
      .post('/v1/admin/activities')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send(VALID_BODY);

    expect(res.status).toBe(500);
    expect(AttendanceModel.create).not.toHaveBeenCalled();
  });

  test('403 — non-admin JWT returns FORBIDDEN', async () => {
    mockAuth(PLAIN_USER);

    const res = await request(app)
      .post('/v1/admin/activities')
      .set('Authorization', `Bearer ${USER_TOKEN}`)
      .send(VALID_BODY);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(ActivityModel.create).not.toHaveBeenCalled();
    expect(AttendanceModel.create).not.toHaveBeenCalled();
  });

  test('401 — missing token returns TOKEN_MISSING', async () => {
    const res = await request(app)
      .post('/v1/admin/activities')
      .send(VALID_BODY);

    expect(res.status).toBe(401);
  });
});

// =============================================================================
// PATCH /v1/admin/activities/:id
// =============================================================================
describe('PATCH /v1/admin/activities/:id', () => {

  const UPDATED = { ...SAVED_ACTIVITY, is_featured: true, seat_capacity: 40 };

  test('200 — updates whitelisted fields and returns updated doc', async () => {
    mockAuth(ADMIN_USER);
    ActivityModel.findByIdAndUpdate = jest.fn().mockReturnValue({
      lean: () => Promise.resolve(UPDATED),
    });

    const res = await request(app)
      .patch(`/v1/admin/activities/${SAVED_ACTIVITY._id}`)
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ is_featured: true, seat_capacity: 40 });

    expect(res.status).toBe(200);
    expect(res.body.data.is_featured).toBe(true);
    expect(res.body.data.seat_capacity).toBe(40);
  });

  test('hero_image_url can be updated via JSON body (plain Google Drive link)', async () => {
    const newUrl = 'https://drive.google.com/uc?export=view&id=NEW_ID';
    mockAuth(ADMIN_USER);
    ActivityModel.findByIdAndUpdate = jest.fn().mockReturnValue({
      lean: () => Promise.resolve({ ...SAVED_ACTIVITY, hero_image_url: newUrl }),
    });

    const res = await request(app)
      .patch(`/v1/admin/activities/${SAVED_ACTIVITY._id}`)
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ hero_image_url: newUrl });

    expect(res.status).toBe(200);
    const [, updateArg] = ActivityModel.findByIdAndUpdate.mock.calls[0];
    expect(updateArg.$set.hero_image_url).toBe(newUrl);
  });

  test('registration window fields are accepted (open_registration_at, close_registration_at, override)', async () => {
    mockAuth(ADMIN_USER);
    ActivityModel.findByIdAndUpdate = jest.fn().mockReturnValue({
      lean: () => Promise.resolve(UPDATED),
    });

    await request(app)
      .patch(`/v1/admin/activities/${SAVED_ACTIVITY._id}`)
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({
        open_registration_at:       '2026-07-01T00:00:00Z',
        close_registration_at:      '2026-08-01T00:00:00Z',
        registration_open_override: null,
      });

    const [, updateArg] = ActivityModel.findByIdAndUpdate.mock.calls[0];
    expect(updateArg.$set.open_registration_at).toBe('2026-07-01T00:00:00Z');
    expect(updateArg.$set.close_registration_at).toBe('2026-08-01T00:00:00Z');
    expect(updateArg.$set.registration_open_override).toBeNull();
  });

  test('enrolled_count is never included in $set', async () => {
    mockAuth(ADMIN_USER);
    ActivityModel.findByIdAndUpdate = jest.fn().mockReturnValue({
      lean: () => Promise.resolve(UPDATED),
    });

    await request(app)
      .patch(`/v1/admin/activities/${SAVED_ACTIVITY._id}`)
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ is_featured: true, enrolled_count: 999 });

    const [, updateArg] = ActivityModel.findByIdAndUpdate.mock.calls[0];
    expect(updateArg.$set.enrolled_count).toBeUndefined();
    expect(updateArg.$set.is_featured).toBe(true);
  });

  test('_id, created_at, deleted_at are silently dropped', async () => {
    mockAuth(ADMIN_USER);
    ActivityModel.findByIdAndUpdate = jest.fn().mockReturnValue({
      lean: () => Promise.resolve(UPDATED),
    });

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

    const res = await request(app)
      .patch(`/v1/admin/activities/${SAVED_ACTIVITY._id}`)
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ enrolled_count: 5, _id: 'hack', deleted_at: 'now' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(ActivityModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  test('404 NOT_FOUND — activity does not exist', async () => {
    mockAuth(ADMIN_USER);
    ActivityModel.findByIdAndUpdate = jest.fn().mockReturnValue({
      lean: () => Promise.resolve(null),
    });

    const res = await request(app)
      .patch('/v1/admin/activities/ghost-id')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ is_featured: true });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  test('403 — non-admin is rejected', async () => {
    mockAuth(PLAIN_USER);

    const res = await request(app)
      .patch(`/v1/admin/activities/${SAVED_ACTIVITY._id}`)
      .set('Authorization', `Bearer ${USER_TOKEN}`)
      .send({ is_featured: true });

    expect(res.status).toBe(403);
    expect(ActivityModel.findByIdAndUpdate).not.toHaveBeenCalled();
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

  test('countDocuments filters on PAID and JOINED only', async () => {
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

  test('403 — non-admin rejected, no DB calls', async () => {
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
