const { Jimp }          = require('jimp');
const jsQR              = require('jsqr');
const PaymentModel      = require('../models/Payment.model');
const RegistrationModel = require('../models/Registration.model');
const ActivityModel     = require('../models/Activity.model');

// ── Optional EMV amount extraction ───────────────────────────────────────────
function tryExtractEMVAmount(qrString) {
  try {
    let i = 0;
    while (i + 4 <= qrString.length) {
      const tag = qrString.slice(i, i + 2);
      const len = parseInt(qrString.slice(i + 2, i + 4), 10);
      if (isNaN(len) || len < 0) break;
      const val = qrString.slice(i + 4, i + 4 + len);
      if (tag === '54') { const n = parseFloat(val); return isNaN(n) ? null : n; }
      i += 4 + len;
    }
  } catch (_) {}
  return null;
}

// ── In-memory QR decode (3-pass) ─────────────────────────────────────────────
async function decodeQRFromBuffer(imageBuffer) {
  let image;
  try {
    image = await Jimp.read(imageBuffer);
  } catch {
    const err = new Error('Could not read the image. Please upload a valid JPEG or PNG.');
    err.statusCode = 422; err.code = 'QR_UNREADABLE'; throw err;
  } finally {
    imageBuffer = null; // eslint-disable-line no-param-reassign
  }

  let result = jsQR(image.bitmap.data, image.bitmap.width, image.bitmap.height);
  if (result) return result.data;

  image.greyscale().contrast(1);
  result = jsQR(image.bitmap.data, image.bitmap.width, image.bitmap.height);
  if (result) return result.data;

  image.invert();
  result = jsQR(image.bitmap.data, image.bitmap.width, image.bitmap.height);
  if (result) return result.data;

  const err = new Error('No QR code found in the uploaded slip. Please upload a clearer photo.');
  err.statusCode = 422; err.code = 'QR_UNREADABLE'; throw err;
}

class PaymentHelper {

  // ── POST /registrations/:id/payment ─────────────────────────────
  static async verifySlip(registrationId, requestingUser, slipBuffer) {
    const registration = await RegistrationModel.findById(registrationId).lean();
    if (!registration) {
      const err = new Error('Registration not found.');
      err.statusCode = 404; err.code = 'NOT_FOUND'; throw err;
    }
    if (registration.user_id !== requestingUser._id.toString()) {
      const err = new Error('Access denied.');
      err.statusCode = 403; err.code = 'FORBIDDEN'; throw err;
    }
    if (registration.status !== 'PENDING') {
      const err = new Error(`Registration is already ${registration.status}.`);
      err.statusCode = 422; err.code = 'ALREADY_PAID'; throw err;
    }

    const activity = await ActivityModel.findById(registration.activity_id).lean();
    if (!activity) {
      const err = new Error('Associated activity not found.');
      err.statusCode = 404; err.code = 'NOT_FOUND'; throw err;
    }

    const qrString      = await decodeQRFromBuffer(slipBuffer);
    const detectedAmount = tryExtractEMVAmount(qrString);

    const existing = await PaymentModel.findOne({ promptpay_qr_data: qrString }).lean();
    if (existing) {
      const err = new Error('This payment slip has already been submitted.');
      err.statusCode = 409; err.code = 'DUPLICATE_PAYMENT'; throw err;
    }

    const submittedAt = new Date();
    const payment = await PaymentModel.create({
      registration_id:   registrationId,
      user_id:           requestingUser._id,
      amount:            detectedAmount,
      promptpay_qr_data: qrString,
      slip_submitted_at: submittedAt,
      status:            'WAITING',
    });

    // Slip received — set registration to PAID and increment enrolled_count
    await RegistrationModel.findByIdAndUpdate(registrationId, { $set: { status: 'PAID' } });
    await ActivityModel.findByIdAndUpdate(registration.activity_id, { $inc: { enrolled_count: 1 } });

    return {
      payment_id:        payment._id,
      registration_id:   registrationId,
      status:            'WAITING',
      slip_submitted_at: submittedAt.toISOString(),
      detected_amount:   detectedAmount,
      activity_price:    activity.price,
      note:              detectedAmount === null
        ? 'QR amount could not be read. Finance team will verify the payment.'
        : null,
    };
  }

  // ── PATCH /admin/payments/:id/status ────────────────────────────
  /**
   * Finance team verifies or rejects a payment submission.
   *
   * WAITING  → VERIFIED : confirm money received
   * WAITING  → FAILED   : reject (wrong amount, wrong account, etc.)
   * VERIFIED → FAILED   : reverse a mistaken verification
   * FAILED   → WAITING  : re-open for re-review
   *
   * On FAILED: if the linked registration is PAID, revert it to PENDING
   *            and decrement enrolled_count so the seat opens back up.
   * On VERIFIED (from WAITING/FAILED): ensure registration is PAID (no-op if already).
   *
   * @param {string}      paymentId
   * @param {string}      newStatus  — 'VERIFIED' | 'FAILED' | 'WAITING'
   * @param {string|null} note       — optional finance note
   * @param {string|null} groupName  — optionally assign group at payment verification time
   */
  static async adminUpdatePaymentStatus(paymentId, newStatus, note, groupName) {
    const ALLOWED_STATUSES = ['WAITING', 'VERIFIED', 'FAILED'];
    if (!ALLOWED_STATUSES.includes(newStatus)) {
      const err = new Error(`Invalid status. Must be one of: ${ALLOWED_STATUSES.join(', ')}.`);
      err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
    }

    const payment = await PaymentModel.findById(paymentId).lean();
    if (!payment) {
      const err = new Error('Payment not found.');
      err.statusCode = 404; err.code = 'NOT_FOUND'; throw err;
    }

    if (payment.status === newStatus) {
      const err = new Error(`Payment is already ${newStatus}.`);
      err.statusCode = 422; err.code = 'INVALID_STATUS_TRANSITION'; throw err;
    }

    const $set = { status: newStatus };
    if (note      !== undefined) $set.note       = note;
    if (newStatus === 'VERIFIED') $set.verified_at = new Date();
    if (newStatus !== 'VERIFIED') $set.verified_at = null;

    const updated = await PaymentModel.findByIdAndUpdate(
      paymentId, { $set }, { new: true }
    ).lean();

    // ── Side-effects on registration + enrolled_count ──────────────
    const registration = await RegistrationModel.findById(payment.registration_id).lean();
    if (registration) {
      if (newStatus === 'FAILED' && registration.status === 'PAID') {
        // Slip rejected — revert registration to PENDING, free the seat
        await RegistrationModel.findByIdAndUpdate(
          payment.registration_id, { $set: { status: 'PENDING' } }
        );
        await ActivityModel.findByIdAndUpdate(
          registration.activity_id, { $inc: { enrolled_count: -1 } }
        );
      } else if (newStatus === 'VERIFIED' && registration.status === 'PENDING') {
        // Edge case: slip was reverted to WAITING/FAILED and now re-verified
        await RegistrationModel.findByIdAndUpdate(
          payment.registration_id, { $set: { status: 'PAID' } }
        );
        await ActivityModel.findByIdAndUpdate(
          registration.activity_id, { $inc: { enrolled_count: 1 } }
        );
      }

      // Assign group_name at verification time if provided
      if (groupName !== undefined && groupName !== null) {
        await RegistrationModel.findByIdAndUpdate(
          payment.registration_id, { $set: { group_name: groupName } }
        );
      }
    }

    return updated;
  }

  // ── POST /registrations/preview ────────────────────────────────
  /**
   * QR-decode-only pre-check for the paid-registration flow.
   *
   * Used by the frontend BEFORE it commits to creating a new user
   * account + registration. Returns 422 (QR_UNREADABLE) for any
   * image that cannot be parsed or that has no readable QR.
   *
   * No DB writes — this is purely a validation gate. Mirrors the
   * QR-decode step of `verifySlip`, minus everything else.
   *
   * @param  {Buffer} slipBuffer
   * @return {Promise<{ qr_readable: true, qr_length: number }>}
   */
  static async previewSlip(slipBuffer) {
    const qrString = await decodeQRFromBuffer(slipBuffer);
    return { qr_readable: true, qr_length: qrString.length };
  }
}

module.exports = PaymentHelper;
