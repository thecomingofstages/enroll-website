const PaymentModel      = require('../models/Payment.model');
const RegistrationModel = require('../models/Registration.model');
const ActivityModel     = require('../models/Activity.model');

class PaymentHelper {
  /**
   * POST /registrations/:id/payment
   * Accepts multer buffer from req.file.buffer — never touches disk.
   */
  static async verifySlip(registrationId, requestingUser, slipBuffer) {
    // TODO:
    // 1. Verify registration belongs to user and is PENDING
    // 2. Decode QR from slipBuffer in-memory (jsqr / zxing-js)
    // 3. Validate PromptPay EMV format, extract amount + ref
    // 4. Compare amount vs activity.price — throw AMOUNT_MISMATCH if different
    // 5. Check PAYMENTS for duplicate promptpay_qr_data — throw DUPLICATE_PAYMENT if found
    // 6. Insert PAYMENT (status: VERIFIED), null the buffer
    // 7. $set REGISTRATION status → PAID
    // 8. $inc ACTIVITY enrolled_count by 1 (atomic)
    // 9. Return payment confirmation
    throw new Error('Not implemented');
  }

 
}

module.exports = PaymentHelper;
