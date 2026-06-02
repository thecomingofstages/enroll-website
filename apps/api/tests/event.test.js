/**
 * tests/event.test.js
 *
 * Tests for:
 *   POST /v1/events/scan
 *   POST /v1/admin/activities/:id/export
 *
 * Mocks: UserModel, ActivityModel, RegistrationModel, AttendanceModel,
 *        PaymentModel, QRUtil (for scan tests only)
 */

const request  = require('supertest');
const ExcelJS  = require('exceljs');

jest.mock('../src/app/models/User.model');
jest.mock('../src/app/models/Activity.model');
jest.mock('../src/app/models/Registration.model');
jest.mock('../src/app/models/Attendance.model');
jest.mock('../src/app/models/Payment.model');
jest.mock('../src/app/utils/QR.util');

const UserModel         = require('../src/app/models/User.model');
const ActivityModel     = require('../src/app/models/Activity.model');
const RegistrationModel = require('../src/app/models/Registration.model');
const AttendanceModel   = require('../src/app/models/Attendance.model');
const PaymentModel      = require('../src/app/models/Payment.model');
const QRUtil            = require('../src/app/utils/QR.util');

const buildApp = require('./helpers/app');
const JWTUtil  = require('../src/app/utils/JWT.util');

const app = buildApp();

// ── Fixtures ──────────────────────────────────────────────────────────────────
const ADMIN_USER = { _id: 'admin-uuid', nickname: 'Admin', role: 'admin' };
const PLAIN_USER = { _id: 'user-uuid-001', first_name: 'Golf', last_name: 'Jaidee', nickname: 'Golf', phone: '0811111111', gender: 'Male', email: 'golf@test.com', interests: ['drama'], role: 'user' };

const ADMIN_TOKEN = JWTUtil.signAccess({ sub: ADMIN_USER._id, nickname: ADMIN_USER.nickname, role: 'admin' });

const ACTIVITY = {
  _id:            'act-uuid-001',
  name:           'Improv Workshop',
  description:    'Fun improv.',
  hero_image_url: 'https://cdn.example.com/img.jpg',
  price:          500,
  seat_capacity:  30,
  enrolled_count: 2,
  tags:           ['improv'],
  benefits:       ['Certificate'],
  is_registration_open: true,
  is_featured:    false,
  schedule: [{
    date:  new Date('2026-08-01'),
    venue: 'Studio A',
    slots: [{ start_time: '09:00', end_time: '12:00', title: 'Morning', description: null }],
  }],
  extra_questions: [{ question_id: 'q1', question_text: 'T-Shirt size?', type: 'single_choice', options: ['S','M','L'], is_required: true }],
};

const PAID_REG = {
  _id: 'reg-uuid-001', user_id: PLAIN_USER._id,
  activity_id: ACTIVITY._id, status: 'PAID', group_name: 'A-01',
  registered_at: new Date('2026-07-01'), custom_answers: [{ question_id: 'q1', answer: 'M' }],
};
const JOINED_REG = { ...PAID_REG, _id: 'reg-uuid-002', status: 'JOINED' };

const PAYMENT = {
  _id: 'pay-uuid-001', registration_id: PAID_REG._id,
  user_id: PLAIN_USER._id, amount: 500,
  status: 'VERIFIED', verified_at: new Date('2026-07-01T10:00:00Z'),
};

function mockAdmin() {
  UserModel.findById = jest.fn().mockReturnValue({ lean: () => Promise.resolve(ADMIN_USER) });
}

afterEach(() => jest.clearAllMocks());

// =============================================================================
// POST /v1/events/scan
// =============================================================================
describe('POST /v1/events/scan', () => {

  const VALID_QR_PAYLOAD = { user_id: PLAIN_USER._id, iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000) + 300 };

  test('200 — valid QR + PAID registration → JOINED, pushed to Attendance', async () => {
    mockAdmin();
    QRUtil.verify = jest.fn().mockReturnValue(VALID_QR_PAYLOAD);

    RegistrationModel.findOne         = jest.fn().mockReturnValue({ lean: () => Promise.resolve(PAID_REG) });
    UserModel.findById
      .mockReturnValueOnce({ lean: () => Promise.resolve(ADMIN_USER) })  // requireAdmin
      .mockReturnValueOnce({ lean: () => Promise.resolve(PLAIN_USER) }); // fetch user for display
    ActivityModel.findById            = jest.fn().mockReturnValue({ lean: () => Promise.resolve(ACTIVITY), select: () => ({ lean: () => Promise.resolve({ name: ACTIVITY.name }) }) });
    RegistrationModel.findByIdAndUpdate = jest.fn().mockResolvedValue({});
    AttendanceModel.findOneAndUpdate  = jest.fn().mockResolvedValue({});


    const res = await request(app)
      .post('/v1/events/scan')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ qr_token: 'valid.token', event_id: ACTIVITY._id });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('JOINED');
    expect(res.body.data.user.nickname).toBe(PLAIN_USER.nickname);

    // Registration must be updated to JOINED with group_name
    expect(RegistrationModel.findByIdAndUpdate).toHaveBeenCalledWith(
      PAID_REG._id,
      { $set: { status: 'JOINED' } }
    );

    // Attendance must be updated with $push on today's date key
    const [attFilter, attUpdate] = AttendanceModel.findOneAndUpdate.mock.calls[0];
    expect(attFilter.activity_id).toBe(ACTIVITY._id);
    const pushKey = Object.keys(attUpdate.$push)[0];
    expect(pushKey).toMatch(/^attendance\.\d{4}-\d{2}-\d{2}$/);
    expect(attUpdate.$push[pushKey]).toBe(PLAIN_USER._id);
  });

  test('200 — only qr_token + event_id required', async () => {
    mockAdmin();
    QRUtil.verify = jest.fn().mockReturnValue(VALID_QR_PAYLOAD);
    RegistrationModel.findOne           = jest.fn().mockReturnValue({ lean: () => Promise.resolve(PAID_REG) });
    UserModel.findById
      .mockReturnValueOnce({ lean: () => Promise.resolve(ADMIN_USER) })
      .mockReturnValueOnce({ lean: () => Promise.resolve(PLAIN_USER) });
    ActivityModel.findById              = jest.fn().mockReturnValue({ lean: () => Promise.resolve(ACTIVITY), select: () => ({ lean: () => Promise.resolve({ name: ACTIVITY.name }) }) });
    RegistrationModel.findByIdAndUpdate = jest.fn().mockResolvedValue({});
    AttendanceModel.findOneAndUpdate    = jest.fn().mockResolvedValue({});

    await request(app)
      .post('/v1/events/scan')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ qr_token: 'valid.token', event_id: ACTIVITY._id });

    const [, updateArg] = RegistrationModel.findByIdAndUpdate.mock.calls[0];
    expect(updateArg.$set).toEqual({ status: 'JOINED' });
  });

  test('422 QR_EXPIRED — QRUtil.verify throws QR_EXPIRED', async () => {
    mockAdmin();
    const err = Object.assign(new Error('QR token expired'), { statusCode: 422, code: 'QR_EXPIRED' });
    QRUtil.verify = jest.fn().mockImplementation(() => { throw err; });

    const res = await request(app)
      .post('/v1/events/scan')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ qr_token: 'expired.token', event_id: ACTIVITY._id });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('QR_EXPIRED');
    expect(RegistrationModel.findOne).not.toHaveBeenCalled();
  });

  test('422 INVALID_QR — QRUtil.verify throws INVALID_QR', async () => {
    mockAdmin();
    const err = Object.assign(new Error('Invalid QR'), { statusCode: 422, code: 'INVALID_QR' });
    QRUtil.verify = jest.fn().mockImplementation(() => { throw err; });

    const res = await request(app)
      .post('/v1/events/scan')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ qr_token: 'tampered.token', event_id: ACTIVITY._id });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('INVALID_QR');
  });

  test('404 NOT_ENROLLED — user has no registration for this event', async () => {
    mockAdmin();
    QRUtil.verify = jest.fn().mockReturnValue(VALID_QR_PAYLOAD);
    RegistrationModel.findOne = jest.fn().mockReturnValue({ lean: () => Promise.resolve(null) });

    const res = await request(app)
      .post('/v1/events/scan')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ qr_token: 'valid.token', event_id: ACTIVITY._id });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_ENROLLED');
    expect(RegistrationModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  test('422 ALREADY_JOINED — registration is already JOINED', async () => {
    mockAdmin();
    QRUtil.verify = jest.fn().mockReturnValue(VALID_QR_PAYLOAD);
    RegistrationModel.findOne = jest.fn().mockReturnValue({ lean: () => Promise.resolve(JOINED_REG) });

    const res = await request(app)
      .post('/v1/events/scan')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ qr_token: 'valid.token', event_id: ACTIVITY._id });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('ALREADY_JOINED');
    expect(RegistrationModel.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(AttendanceModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  test('422 PAYMENT_REQUIRED — registration is PENDING (not paid)', async () => {
    mockAdmin();
    QRUtil.verify = jest.fn().mockReturnValue(VALID_QR_PAYLOAD);
    const pendingReg = { ...PAID_REG, status: 'PENDING' };
    RegistrationModel.findOne = jest.fn().mockReturnValue({ lean: () => Promise.resolve(pendingReg) });

    const res = await request(app)
      .post('/v1/events/scan')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ qr_token: 'valid.token', event_id: ACTIVITY._id });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('PAYMENT_REQUIRED');
  });

  test('400 VALIDATION_ERROR — missing qr_token or event_id', async () => {
    mockAdmin();
    QRUtil.verify = jest.fn();

    const res = await request(app)
      .post('/v1/events/scan')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ event_id: ACTIVITY._id }); // no qr_token

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(QRUtil.verify).not.toHaveBeenCalled();
  });

  test('findOne filters out CANCELLED registrations', async () => {
    mockAdmin();
    QRUtil.verify = jest.fn().mockReturnValue(VALID_QR_PAYLOAD);
    RegistrationModel.findOne           = jest.fn().mockReturnValue({ lean: () => Promise.resolve(null) });
    RegistrationModel.findByIdAndUpdate = jest.fn();
    AttendanceModel.findOneAndUpdate    = jest.fn();

    await request(app)
      .post('/v1/events/scan')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ qr_token: 'valid.token', event_id: ACTIVITY._id });

    const [filter] = RegistrationModel.findOne.mock.calls[0];
    expect(filter.status.$nin).toContain('CANCELLED');
  });

  test('403 — non-admin token is rejected', async () => {
    const plainToken = JWTUtil.signAccess({ sub: PLAIN_USER._id, nickname: 'Golf', role: 'user' });
    UserModel.findById = jest.fn().mockReturnValue({ lean: () => Promise.resolve(PLAIN_USER) });

    const res = await request(app)
      .post('/v1/events/scan')
      .set('Authorization', `Bearer ${plainToken}`)
      .send({ qr_token: 'x', event_id: 'y' });

    expect(res.status).toBe(403);
  });

  test('401 — no token', async () => {
    const res = await request(app)
      .post('/v1/events/scan')
      .send({ qr_token: 'x', event_id: 'y' });
    expect(res.status).toBe(401);
  });
});

// =============================================================================
// POST /v1/admin/activities/:id/export
// =============================================================================
describe('POST /v1/admin/activities/:id/export', () => {

  function setupExportMocks() {
    mockAdmin();
    ActivityModel.findById = jest.fn().mockReturnValue({ lean: () => Promise.resolve(ACTIVITY) });
    RegistrationModel.find = jest.fn().mockReturnValue({ lean: () => Promise.resolve([PAID_REG, JOINED_REG]) });
    UserModel.find         = jest.fn().mockReturnValue({ lean: () => Promise.resolve([PLAIN_USER]) });
    PaymentModel.find      = jest.fn().mockReturnValue({ lean: () => Promise.resolve([PAYMENT]) });
    AttendanceModel.findOne = jest.fn().mockReturnValue({
      lean: () => Promise.resolve({
        activity_id: ACTIVITY._id,
        attendance: { '2026-08-01': [PLAIN_USER._id] },
      }),
    });
  }

  test('200 — returns xlsx binary with correct Content-Type and Content-Disposition', async () => {
    setupExportMocks();

    const res = await request(app)
      .post(`/v1/admin/activities/${ACTIVITY._id}/export`)
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .buffer(true)
      .parse((res, callback) => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      });
    // 
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, 'debug-export.xlsx');
    
    console.log('Saving XLSX buffer to:', filePath);
    fs.writeFileSync(filePath, res.body); 
    console.log('XLSX saved to:', filePath);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/spreadsheetml/);
    expect(res.headers['content-disposition']).toMatch(/attachment/);
    expect(res.headers['content-disposition']).toMatch(/\.xlsx/);
    expect(Buffer.isBuffer(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(1000); // real xlsx is never tiny
  });

  test('xlsx has exactly 5 sheets with correct names', async () => {
    setupExportMocks();

    const res = await request(app)
      .post(`/v1/admin/activities/${ACTIVITY._id}/export`)
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .buffer(true)
      .parse((res, callback) => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      });

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(res.body);

    expect(wb.worksheets.length).toBe(5);
    const names = wb.worksheets.map(ws => ws.name);
    expect(names.some(n => n.includes('Summary'))).toBe(true);
    expect(names.some(n => n.includes('Registration'))).toBe(true);
    expect(names.some(n => n.includes('Attendance'))).toBe(true);
    expect(names.some(n => n.includes('Payment'))).toBe(true);
    expect(names.some(n => n.includes('Demographic'))).toBe(true);
  });

  test('Registrations sheet contains participant data and custom answer columns', async () => {
    setupExportMocks();

    const res = await request(app)
      .post(`/v1/admin/activities/${ACTIVITY._id}/export`)
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .buffer(true)
      .parse((res, callback) => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      });

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(res.body);

    const regSheet = wb.worksheets.find(ws => ws.name.includes('Registration'));
    expect(regSheet).toBeDefined();

    // Header row should include the extra question text
    const headerValues = regSheet.getRow(1).values.filter(Boolean);
    expect(headerValues).toContain('T-Shirt size?');
    expect(headerValues).toContain('Email');
    expect(headerValues).toContain('Status');

    // Data rows — should have one row per registration
    const dataRowCount = regSheet.rowCount - 1; // minus header
    expect(dataRowCount).toBeGreaterThanOrEqual(2); // PAID + JOINED
  });

  test('Attendance sheet shows check-in grid with correct date column', async () => {
    setupExportMocks();

    const res = await request(app)
      .post(`/v1/admin/activities/${ACTIVITY._id}/export`)
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .buffer(true)
      .parse((res, callback) => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      });

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(res.body);

    const attSheet = wb.worksheets.find(ws => ws.name.includes('Attendance'));
    expect(attSheet).toBeDefined();

    // Header row should contain the date '2026-08-01'
    const headerValues = attSheet.getRow(1).values.filter(Boolean);
    expect(headerValues).toContain('2026-08-01');
  });

  test('Payments sheet shows correct total revenue', async () => {
    setupExportMocks();

    const res = await request(app)
      .post(`/v1/admin/activities/${ACTIVITY._id}/export`)
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .buffer(true)
      .parse((res, callback) => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      });

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(res.body);

    const paySheet = wb.worksheets.find(ws => ws.name.includes('Payment'));
    expect(paySheet).toBeDefined();

    // Find the TOTAL row — last row with data
    let totalAmount = null;
    paySheet.eachRow(row => {
      if (row.getCell(2).value === 'TOTAL') {
        totalAmount = row.getCell(6).value;
      }
    });
    expect(totalAmount).toBe(500); // one payment of 500
  });

  test('404 — activity does not exist', async () => {
    mockAdmin();
    ActivityModel.findById = jest.fn().mockReturnValue({ lean: () => Promise.resolve(null) });

    const res = await request(app)
      .post('/v1/admin/activities/ghost-id/export')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  test('403 — non-admin is rejected', async () => {
    const plainToken = JWTUtil.signAccess({ sub: PLAIN_USER._id, nickname: 'Golf', role: 'user' });
    UserModel.findById = jest.fn().mockReturnValue({ lean: () => Promise.resolve(PLAIN_USER) });

    const res = await request(app)
      .post(`/v1/admin/activities/${ACTIVITY._id}/export`)
      .set('Authorization', `Bearer ${plainToken}`);

    expect(res.status).toBe(403);
    expect(ActivityModel.findById).not.toHaveBeenCalled();
  });

  test('401 — no token', async () => {
    const res = await request(app)
      .post(`/v1/admin/activities/${ACTIVITY._id}/export`);
    expect(res.status).toBe(401);
  });
});
