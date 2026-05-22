const Jimp              = require('jimp');
const jsQR              = require('jsqr');
const PaymentModel      = require('../models/Payment.model');
const RegistrationModel = require('../models/Registration.model');
const ActivityModel     = require('../models/Activity.model');

// ── Optional EMV amount extraction ───────────────────────────────────────────
/**
 * Try to extract a transaction amount from an EMV QR string (tag 54).
 * This is best-effort — if the QR isn't EMV or has no tag 54, returns null.
 * We never reject a slip based on this; finance team owns verification.
 *
 * @param  {string} qrString
 * @returns {number|null}
 */
function tryExtractEMVAmount(qrString) {
  try {
    let i = 0;
    while (i + 4 <= qrString.length) {
      const tag = qrString.slice(i, i + 2);
      const len = parseInt(qrString.slice(i + 2, i + 4), 10);
      if (isNaN(len) || len < 0) break;
      const val = qrString.slice(i + 4, i + 4 + len);
      if (tag === '54') {
        const amount = parseFloat(val);
        return isNaN(amount) ? null : amount;
      }
      i += 4 + len;
    }
  } catch (_) { /* non-EMV QR — ignore */ }
  return null;
}

// ── In-memory QR decode ───────────────────────────────────────────────────────
/**
 * Decode a QR code from an image buffer (JPEG or PNG).
 * The QR can be anywhere in the image — jsqr scans the full bitmap.
 *
 * 3-pass strategy for robustness:
 *   1. Raw image                    — fastest, works for clean screenshots
 *   2. Grayscale + contrast boost   — helps faded/low-contrast slips
 *   3. Grayscale + invert           — handles dark-background QRs
 *
 * Buffer is nulled after Jimp reads it into a bitmap so GC can reclaim it.
 * Any bank app QR is accepted — PromptPay, SCB, KBank, BBL, etc.
 *
 * @param  {Buffer} imageBuffer
 * @returns {string} decoded QR string
 * @throws  422 QR_UNREADABLE if no QR found after all passes
 */
async function decodeQRFromBuffer(imageBuffer) {
  let image;
  try {
    image = await Jimp.read(imageBuffer);
  } catch {
    const err = new Error('Could not read the image. Please upload a valid JPEG or PNG.');
    err.statusCode = 422;
    err.code = 'QR_UNREADABLE';
    throw err;
  } finally {
    imageBuffer = null; // eslint-disable-line no-param-reassign
  }

  // Pass 1: raw
  let result = jsQR(image.bitmap.data, image.bitmap.width, image.bitmap.height);
  if (result) return result.data;

  // Pass 2: grayscale + max contrast
  image.grayscale().contrast(1);
  result = jsQR(image.bitmap.data, image.bitmap.width, image.bitmap.height);
  if (result) return result.data;

  // Pass 3: invert (dark-background QR codes)
  image.invert();
  result = jsQR(image.bitmap.data, image.bitmap.width, image.bitmap.height);
  if (result) return result.data;

  const err = new Error('No QR code found in the uploaded slip. Please upload a clearer photo.');
  err.statusCode = 422;
  err.code = 'QR_UNREADABLE';
  throw err;
}

// ── Payment helper ────────────────────────────────────────────────────────────
class PaymentHelper {

  /**
   * POST /registrations/:id/payment
   *
   * We accept slips from any Thai bank app — PromptPay, SCB Easy, KBank,
   * BBL, etc. Our job is to:
   *   1. Decode whatever QR is on the slip
   *   2. Record the submission with a timestamp for finance
   *   3. Set the registration to PAID (pending finance sign-off in practice,
   *      but PAID here means "slip received" not "money confirmed")
   *
   * Finance team handles actual verification via the admin export.
   *
   * Flow:
   *  1. Verify registration exists, belongs to requesting user, is PENDING
   *  2. Decode QR from slip buffer (any format — 3-pass strategy)
   *  3. Best-effort EMV amount extraction (stored for finance reference, not validated)
   *  4. Duplicate QR guard (same QR string already used = replay attack)
   *  5. Record PAYMENT (status: WAITING, slip_submitted_at: now)
   *  6. $set REGISTRATION → PAID
   *  7. $inc ACTIVITY enrolled_count
   *  8. Return confirmation with submitted timestamp
   *
   * @param {string} registrationId
   * @param {object} requestingUser  - from req.user
   * @param {Buffer} slipBuffer      - from req.file.buffer (multer memoryStorage)
   */
  static async verifySlip(registrationId, requestingUser, slipBuffer) {

    // ── 1. Verify registration ─────────────────────────────────────────────
    const registration = await RegistrationModel.findById(registrationId).lean();

    if (!registration) {
      const err = new Error('Registration not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (registration.user_id !== requestingUser._id.toString()) {
      const err = new Error('Access denied.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    if (registration.status !== 'PENDING') {
      const err = new Error(`Registration is already ${registration.status}.`);
      err.statusCode = 422;
      err.code = 'ALREADY_PAID';
      throw err;
    }

    // ── 2. Fetch activity (for enrolled_count update and amount reference) ─
    const activity = await ActivityModel.findById(registration.activity_id).lean();
    if (!activity) {
      const err = new Error('Associated activity not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    // ── 3. Decode QR from slip image  ─────────────────
    const qrString = await decodeQRFromBuffer(slipBuffer);
    // Buffer is nulled inside decodeQRFromBuffer — no reference left

    // ── 4. Best-effort amount extraction (EMV tag 54, never blocks) ────────
    const detectedAmount = tryExtractEMVAmount(qrString);
    // We store this for finance reference — we do NOT reject if mismatched

    // ── 5. Duplicate QR guard ──────────────────────────────────────────────
    const existing = await PaymentModel.findOne({ promptpay_qr_data: qrString }).lean();
    if (existing) {
      const err = new Error('This payment slip has already been submitted.');
      err.statusCode = 409;
      err.code = 'DUPLICATE_PAYMENT';
      throw err;
    }

    // ── 6. Record slip submission ──────────────────────────────────────────
    const submittedAt = new Date();

    const payment = await PaymentModel.create({
      registration_id:   registrationId,
      user_id:           requestingUser._id,
      amount:            detectedAmount, // null if QR had no amount 
      promptpay_qr_data: qrString,       // raw QR string 
      slip_submitted_at: submittedAt,    // timestamp 
      status:            'WAITING',     
    });

    // ── 7. Set registration → PAID ─────────────────────────────────────────
    // "PAID" here means "slip received" — finance confirms the actual transfer
    await RegistrationModel.findByIdAndUpdate(registrationId, {
      $set: { status: 'PAID' },
    });

    // ── 8. Increment enrolled_count (atomic) ───────────────────────────────
    await ActivityModel.findByIdAndUpdate(registration.activity_id, {
      $inc: { enrolled_count: 1 },
    });

    // ── 9. Return confirmation ─────────────────────────────────────────────
    return {
      payment_id:        payment._id,
      registration_id:   registrationId,
      status:            'WAITING',
      slip_submitted_at: submittedAt.toISOString(),
      detected_amount:   detectedAmount,   // shown to user as reference, not authoritative
      activity_price:    activity.price,   // what they should have paid
      promptpay_qr_data: qrString,       // echoed back for reference (not recommended to show in real app)
      note:              detectedAmount === null
        ? 'QR amount could not be read. Finance team will verify the payment.'
        : null,
    };
  }
}

module.exports = PaymentHelper;