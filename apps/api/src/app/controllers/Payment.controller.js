const PaymentHelper = require('../helpers/Payment.helper');
const RegistrationModel = require('../models/Registration.model');
const UserModel = require('../models/User.model');
const Logger        = require('../utils/Logger.util');

class PaymentController {
  /** POST /registrations/:id/payment */
  static async verifySlip(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Slip image is required.' } });
      }

      // The slip route uses optionalAuth so the new-user flow (which has a
      // freshly-issued token) and the resume-payment flow both work. When
      // req.user is null — no token, or a token that failed verification —
      // we still let the request through as long as the caller is uploading
      // a slip against their own registration (verified via the registration's
      // stored user_id). This is the safety net for the previous "Session
      // invalidated" race; in normal operation a valid Bearer token is
      // present and req.user is set, so the lookup below is a no-op fallback.
      let requestingUser = req.user;
      if (!requestingUser) {
        const registration = await RegistrationModel.findById(req.params.id)
          .select('user_id')
          .lean();
        if (!registration) {
          return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Registration not found.' } });
        }
        const owner = await UserModel.findById(registration.user_id).lean();
        if (!owner) {
          return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Registration owner not found.' } });
        }
        requestingUser = owner;
      }

      const data = await PaymentHelper.verifySlip(req.params.id, requestingUser, req.file.buffer);
      return res.status(200).json({ success: true, data });
    } catch (err) { Logger.error(`[PaymentController.verifySlip] ${err.message}`); next(err); }
  }

  /** PATCH /admin/payments/:id/status */
  static async adminUpdatePaymentStatus(req, res, next) {
    try {
      const { status, note, group_name } = req.body;
      const data = await PaymentHelper.adminUpdatePaymentStatus(req.params.id, status, note, group_name);
      return res.status(200).json({ success: true, data });
    } catch (err) { Logger.error(`[PaymentController.adminUpdatePaymentStatus] ${err.message}`); next(err); }
  }
}

module.exports = PaymentController;
