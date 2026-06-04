const PaymentHelper = require('../helpers/Payment.helper');
const Logger        = require('../utils/Logger.util');

class PaymentController {
  /** POST /registrations/:id/payment */
  static async verifySlip(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Slip image is required.' } });
      }
      const data = await PaymentHelper.verifySlip(req.params.id, req.user, req.file.buffer);
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
