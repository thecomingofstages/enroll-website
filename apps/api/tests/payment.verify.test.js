// return for now because the time take too long to run the test, need to optimize the test later
// return;

/**
 * tests/payment.verify.test.js
 *
 * Tests for POST /v1/registrations/:id/payment
 *
 * Design principle:
 *   - Any bank app QR is accepted (PromptPay, SCB, KBank, BBL, plain URL, etc.)
 *   - We decode and store; finance team owns verification
 *   - Amount from QR is best-effort reference only — never a blocker
 *   - slip_submitted_at timestamp is always recorded
 *
 * Uses real QR image generation so the jimp + jsqr pipeline is exercised.
 * Mocks: UserModel, RegistrationModel, ActivityModel, PaymentModel
 */

const request = require('supertest');
const QRCode  = require('qrcode');
const Jimp    = require('jimp');

jest.mock('../src/app/models/User.model');
jest.mock('../src/app/models/Registration.model');
jest.mock('../src/app/models/Activity.model');
jest.mock('../src/app/models/Payment.model');

const UserModel         = require('../src/app/models/User.model');
const RegistrationModel = require('../src/app/models/Registration.model');
const ActivityModel     = require('../src/app/models/Activity.model');
const PaymentModel      = require('../src/app/models/Payment.model');

const buildApp = require('./helpers/app');
const JWTUtil  = require('../src/app/utils/JWT.util');

let app;

beforeAll(() => {
  app = buildApp();
});

// ── Auth fixtures ─────────────────────────────────────────────────────────────
const USER  = { _id: 'user-uuid-001', nickname: 'Golf', role: 'user' };
const TOKEN = JWTUtil.signAccess({ sub: USER._id, nickname: USER.nickname, role: 'user' });

// ── QR content fixtures — any format is valid ─────────────────────────────────
// Correct PromptPay EMV dynamic QR with 500 THB (tag 54 present)
const EMV_QR_500 = '00020101021229370016A0000006770101110113006666123456754035005802TH5904TCOS6304ABCD';
// PromptPay EMV static QR — no tag 54 (amount entered at bank app)
const EMV_QR_STATIC = '00020101021129370016A000000677010111011300666612345675802TH5904TCOS6304ABCD';
// SCB/KBank style — different AID, still EMV but not PromptPay
const OTHER_BANK_QR = '00020101021229330016A0000006601011010112345678905404300058025802TH5903SCB6304BBBB';
// Plain URL QR — some apps just encode a URL
const URL_QR        = 'https://qr.kasikornbank.com/pay/confirm?ref=TXN20260516001234';
// Generic string — another app format
const GENERIC_QR    = 'REF:TXN20260516001234|AMT:500|ACC:0661234567|BANK:BBL';

// ── DB fixtures ───────────────────────────────────────────────────────────────
const PENDING_REG = {
  _id: 'reg-uuid-001', user_id: USER._id,
  activity_id: 'act-uuid-001', status: 'PENDING',
};
const PAID_REG   = { ...PENDING_REG, status: 'PAID' };

const ACTIVITY = { _id: 'act-uuid-001', name: 'Improv Workshop', price: 500 };

const SAVED_PAYMENT = {
  _id: 'pay-uuid-001', registration_id: PENDING_REG._id,
  user_id: USER._id, amount: 500, status: 'WAITING',
  slip_submitted_at: new Date(), verified_at: null,
};

// ── Image helpers ─────────────────────────────────────────────────────────────
/** Generate a PNG slip image with a QR code embedded at a given position */
async function makeSlip(qrString, { qrSize = 200, w = 600, h = 900, x = 200, y = 500 } = {}) {
  const qrBuf = await QRCode.toBuffer(qrString, { type: 'png', width: qrSize });
  const qrImg = await Jimp.read(qrBuf);
  const slip  = await Jimp.create(w, h, 0xffffffff);
  slip.composite(qrImg, x, y);
  return new Promise((res, rej) =>
    slip.getBuffer('image/png', (err, buf) => err ? rej(err) : res(buf))
  );
}

function mockAuth() {
  UserModel.findById = jest.fn().mockReturnValue({ lean: () => Promise.resolve(USER) });
}

function mockHappyPath(qrString = EMV_QR_500, savedPayment = SAVED_PAYMENT) {
  mockAuth();
  RegistrationModel.findById          = jest.fn().mockReturnValue({ lean: () => Promise.resolve(PENDING_REG) });
  ActivityModel.findById              = jest.fn().mockReturnValue({ lean: () => Promise.resolve(ACTIVITY) });
  PaymentModel.findOne                = jest.fn().mockReturnValue({ lean: () => Promise.resolve(null) });
  PaymentModel.create                 = jest.fn().mockResolvedValue(savedPayment);
  RegistrationModel.findByIdAndUpdate = jest.fn().mockResolvedValue({});
  ActivityModel.findByIdAndUpdate     = jest.fn().mockResolvedValue({});
}

afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

afterAll(async () => {
  await new Promise(resolve => setTimeout(resolve, 50));
});
// =============================================================================
// Happy paths — any QR format accepted
// =============================================================================
describe('POST /v1/registrations/:id/payment — any bank QR accepted', () => {

  test('200 — EMV PromptPay QR with amount: accepted, status WAITING', async () => {
    mockHappyPath();
    const slip = await makeSlip(EMV_QR_500);

    const res = await request(app)
      .post(`/v1/registrations/${PENDING_REG._id}/payment`)
      .set('Authorization', `Bearer ${TOKEN}`)
      .attach('slip', slip, { filename: 'slip.png', contentType: 'image/png' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Status is WAITING — finance team verifies, not us
    expect(res.body.data.status).toBe('WAITING');
    expect(res.body.data.payment_id).toBe(SAVED_PAYMENT._id);
    // Detected amount is returned as reference
    expect(res.body.data.detected_amount).toBe(500);
    expect(res.body.data.activity_price).toBe(ACTIVITY.price);
  });

  test('200 — EMV static QR (no tag 54, amount unknown): accepted, detected_amount null', async () => {
    mockHappyPath(EMV_QR_STATIC, { ...SAVED_PAYMENT, amount: null });
    const slip = await makeSlip(EMV_QR_STATIC);

    const res = await request(app)
      .post(`/v1/registrations/${PENDING_REG._id}/payment`)
      .set('Authorization', `Bearer ${TOKEN}`)
      .attach('slip', slip, { filename: 'slip.png', contentType: 'image/png' });

    expect(res.status).toBe(200);
    // No amount in QR — finance must verify manually
    expect(res.body.data.detected_amount).toBeNull();
    // Note field informs user that finance will verify
    expect(res.body.data.note).toMatch(/finance/i);
  });

  test('200 — other bank EMV QR (non-PromptPay AID): accepted', async () => {
    mockHappyPath(OTHER_BANK_QR);
    const slip = await makeSlip(OTHER_BANK_QR);

    const res = await request(app)
      .post(`/v1/registrations/${PENDING_REG._id}/payment`)
      .set('Authorization', `Bearer ${TOKEN}`)
      .attach('slip', slip, { filename: 'slip.png', contentType: 'image/png' });

    expect(res.status).toBe(200);
  });

  test('200 — plain URL QR (KBank/SCB app link style): accepted', async () => {
    mockHappyPath(URL_QR, { ...SAVED_PAYMENT, amount: null });
    const slip = await makeSlip(URL_QR);

    const res = await request(app)
      .post(`/v1/registrations/${PENDING_REG._id}/payment`)
      .set('Authorization', `Bearer ${TOKEN}`)
      .attach('slip', slip, { filename: 'slip.png', contentType: 'image/png' });

    expect(res.status).toBe(200);
    expect(res.body.data.detected_amount).toBeNull();
  });

  test('200 — generic string QR (non-standard bank format): accepted', async () => {
    mockHappyPath(GENERIC_QR, { ...SAVED_PAYMENT, amount: null });
    const slip = await makeSlip(GENERIC_QR);

    const res = await request(app)
      .post(`/v1/registrations/${PENDING_REG._id}/payment`)
      .set('Authorization', `Bearer ${TOKEN}`)
      .attach('slip', slip, { filename: 'slip.png', contentType: 'image/png' });

    expect(res.status).toBe(200);
  });

  test('amount mismatch does NOT reject — only stored for finance reference', async () => {
    // EMV QR has 300 THB but activity costs 500 — we accept it anyway
    const EMV_QR_300 = '00020101021229370016A0000006770101110113006666123456754033005802TH5904TCOS6304ABCD';
    mockHappyPath(EMV_QR_300, { ...SAVED_PAYMENT, amount: 300 });
    const slip = await makeSlip(EMV_QR_300);

    const res = await request(app)
      .post(`/v1/registrations/${PENDING_REG._id}/payment`)
      .set('Authorization', `Bearer ${TOKEN}`)
      .attach('slip', slip, { filename: 'slip.png', contentType: 'image/png' });

    // Must still return 200 — finance team handles discrepancy
    expect(res.status).toBe(200);
    expect(res.body.data.detected_amount).toBe(300);
    expect(res.body.data.activity_price).toBe(500);
    // Both amounts visible so finance knows there's a gap
  });

  test('QR stored correctly in PaymentModel.create call', async () => {
    mockHappyPath(URL_QR, { ...SAVED_PAYMENT, amount: null });
    const slip = await makeSlip(URL_QR);

    await request(app)
      .post(`/v1/registrations/${PENDING_REG._id}/payment`)
      .set('Authorization', `Bearer ${TOKEN}`)
      .attach('slip', slip, { filename: 'slip.png', contentType: 'image/png' });

    const createArg = PaymentModel.create.mock.calls[0][0];
    expect(createArg.promptpay_qr_data).toBe(URL_QR);
    expect(createArg.status).toBe('WAITING');
  });

  test('slip_submitted_at timestamp is stored in PaymentModel.create', async () => {
    mockHappyPath();
    const before = new Date();
    const slip   = await makeSlip(EMV_QR_500);

    await request(app)
      .post(`/v1/registrations/${PENDING_REG._id}/payment`)
      .set('Authorization', `Bearer ${TOKEN}`)
      .attach('slip', slip, { filename: 'slip.png', contentType: 'image/png' });

    const after    = new Date();
    const createArg = PaymentModel.create.mock.calls[0][0];

    expect(createArg.slip_submitted_at).toBeInstanceOf(Date);
    expect(createArg.slip_submitted_at.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(createArg.slip_submitted_at.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  test('slip_submitted_at is returned in response as ISO string', async () => {
    mockHappyPath();
    const slip = await makeSlip(EMV_QR_500);

    const res = await request(app)
      .post(`/v1/registrations/${PENDING_REG._id}/payment`)
      .set('Authorization', `Bearer ${TOKEN}`)
      .attach('slip', slip, { filename: 'slip.png', contentType: 'image/png' });

    expect(res.body.data.slip_submitted_at).toBeDefined();
    expect(() => new Date(res.body.data.slip_submitted_at)).not.toThrow();
    expect(new Date(res.body.data.slip_submitted_at).getTime()).toBeGreaterThan(0);
  });

  test('QR embedded anywhere in full slip image (600×900) is found', async () => {
    mockHappyPath();
    // QR in bottom-right corner — real slip position
    const slip = await makeSlip(EMV_QR_500, { x: 370, y: 660 });

    const res = await request(app)
      .post(`/v1/registrations/${PENDING_REG._id}/payment`)
      .set('Authorization', `Bearer ${TOKEN}`)
      .attach('slip', slip, { filename: 'slip.png', contentType: 'image/png' });

    expect(res.status).toBe(200);
    const createArg = PaymentModel.create.mock.calls[0][0];
    expect(createArg.promptpay_qr_data).toBe(EMV_QR_500);
  });

  // test('registration set to PAID and enrolled_count incremented', async () => {
  //   mockHappyPath();
  //   const slip = await makeSlip(EMV_QR_500);

  //   await request(app)
  //     .post(`/v1/registrations/${PENDING_REG._id}/payment`)
  //     .set('Authorization', `Bearer ${TOKEN}`)
  //     .attach('slip', slip, { filename: 'slip.png', contentType: 'image/png' });

  //   expect(RegistrationModel.findByIdAndUpdate).toHaveBeenCalledWith(
  //     PENDING_REG._id, { $set: { status: 'PAID' } }
  //   );
  //   expect(ActivityModel.findByIdAndUpdate).toHaveBeenCalledWith(
  //     PENDING_REG.activity_id, { $inc: { enrolled_count: 1 } }
  //   );
  // });
});

// =============================================================================
// Guard tests — these still block
// =============================================================================
describe('POST /v1/registrations/:id/payment — guards', () => {

  test('422 QR_UNREADABLE — blank image with no QR code', async () => {
    mockAuth();
    RegistrationModel.findById = jest.fn().mockReturnValue({ lean: () => Promise.resolve(PENDING_REG) });
    ActivityModel.findById     = jest.fn().mockReturnValue({ lean: () => Promise.resolve(ACTIVITY) });

    const blankSlip = await new Promise((res, rej) =>
      Jimp.create(600, 900, 0xffffffff).then(img =>
        img.getBuffer('image/png', (err, buf) => err ? rej(err) : res(buf))
      )
    );

    const response = await request(app)
      .post(`/v1/registrations/${PENDING_REG._id}/payment`)
      .set('Authorization', `Bearer ${TOKEN}`)
      .attach('slip', blankSlip, { filename: 'blank.png', contentType: 'image/png' });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('QR_UNREADABLE');
    expect(PaymentModel.create).not.toHaveBeenCalled();
  });

  test('409 DUPLICATE_PAYMENT — same QR already in DB', async () => {
    mockAuth();
    RegistrationModel.findById = jest.fn().mockReturnValue({ lean: () => Promise.resolve(PENDING_REG) });
    ActivityModel.findById     = jest.fn().mockReturnValue({ lean: () => Promise.resolve(ACTIVITY) });
    PaymentModel.findOne       = jest.fn().mockReturnValue({ lean: () => Promise.resolve(SAVED_PAYMENT) });

    const slip = await makeSlip(EMV_QR_500);

    const res = await request(app)
      .post(`/v1/registrations/${PENDING_REG._id}/payment`)
      .set('Authorization', `Bearer ${TOKEN}`)
      .attach('slip', slip, { filename: 'slip.png', contentType: 'image/png' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE_PAYMENT');
    expect(PaymentModel.create).not.toHaveBeenCalled();
  });

  test('404 — registration not found', async () => {
    mockAuth();
    RegistrationModel.findById = jest.fn().mockReturnValue({ lean: () => Promise.resolve(null) });

    const slip = await makeSlip(EMV_QR_500);

    const res = await request(app)
      .post(`/v1/registrations/ghost-id/payment`)
      .set('Authorization', `Bearer ${TOKEN}`)
      .attach('slip', slip, { filename: 'slip.png', contentType: 'image/png' });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  test('403 — registration belongs to different user', async () => {
    mockAuth();
    RegistrationModel.findById = jest.fn().mockReturnValue({
      lean: () => Promise.resolve({ ...PENDING_REG, user_id: 'other-user' }),
    });

    const slip = await makeSlip(EMV_QR_500);

    const res = await request(app)
      .post(`/v1/registrations/${PENDING_REG._id}/payment`)
      .set('Authorization', `Bearer ${TOKEN}`)
      .attach('slip', slip, { filename: 'slip.png', contentType: 'image/png' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  test('422 ALREADY_PAID — registration is not PENDING', async () => {
    mockAuth();
    RegistrationModel.findById = jest.fn().mockReturnValue({ lean: () => Promise.resolve(PAID_REG) });

    const slip = await makeSlip(EMV_QR_500);

    const res = await request(app)
      .post(`/v1/registrations/${PENDING_REG._id}/payment`)
      .set('Authorization', `Bearer ${TOKEN}`)
      .attach('slip', slip, { filename: 'slip.png', contentType: 'image/png' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('ALREADY_PAID');
    expect(PaymentModel.create).not.toHaveBeenCalled();
  });

  test('400 — no slip file attached', async () => {
    mockAuth();

    const res = await request(app)
      .post(`/v1/registrations/${PENDING_REG._id}/payment`)
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(400);
    expect(PaymentModel.create).not.toHaveBeenCalled();
  });

  test('401 — no token', async () => {
    const slip = await makeSlip(EMV_QR_500);

    const res = await request(app)
      .post(`/v1/registrations/${PENDING_REG._id}/payment`)
      .attach('slip', slip, { filename: 'slip.png', contentType: 'image/png' });

    expect(res.status).toBe(401);
  });
});