const express                = require('express');
const router                 = express.Router();
const AuthMiddleware         = require('../middleware/Auth.middleware');
const ActivityController     = require('../controllers/Activity.controller');
const RegistrationController = require('../controllers/Registration.controller');
const PaymentController      = require('../controllers/Payment.controller');
const EventController        = require('../controllers/Event.controller');

router.use(AuthMiddleware.requireAdmin);

// ── Activities ─────────────────────────────────────────────────────────────────
// JSON body — hero_image_url is a Google Drive link string
router.post('/activities',           ActivityController.create);
router.patch('/activities/:id',      ActivityController.update);
router.delete('/activities/:id',     ActivityController.remove);
router.post('/activities/:id/export', EventController.exportActivity);

// ── Registrations ──────────────────────────────────────────────────────────────
router.get('/registrations',                 RegistrationController.adminList);
router.patch('/registrations/:id/status',    RegistrationController.adminUpdateStatus);

// ── Payments ───────────────────────────────────────────────────────────────────
// Finance team verifies/rejects payment slips + can assign group_name
router.patch('/payments/:id/status',         PaymentController.adminUpdatePaymentStatus);

module.exports = router;
