const express                = require('express');
const router                 = express.Router();
const AuthMiddleware         = require('../middleware/Auth.middleware');
const ActivityController     = require('../controllers/Activity.controller');
const RegistrationController = require('../controllers/Registration.controller');
const PaymentController      = require('../controllers/Payment.controller');
const EventController        = require('../controllers/Event.controller');
const StampStoreController   = require('../controllers/StampStore.controller');

router.use(AuthMiddleware.requireAdmin);

// ── Activities ─────────────────────────────────────────────────────────────────
router.post('/activities',            ActivityController.create);
router.patch('/activities/:id',       ActivityController.update);
router.delete('/activities/:id',      ActivityController.remove);
router.post('/activities/:id/export', EventController.exportActivity);

// ── Registrations ──────────────────────────────────────────────────────────────
router.get('/registrations',               RegistrationController.adminList);
router.patch('/registrations/:id/status',  RegistrationController.adminUpdateStatus);

// ── Payments — finance team verifies/rejects slips + group name ────────────────────────────
router.patch('/payments/:id/status',       PaymentController.adminUpdatePaymentStatus);

// ── Stamp Store ────────────────────────────────────────────────────────────────────────────
router.post('/stampstore/create',          StampStoreController.adminCreateStore);
router.patch('/stampstore/changecode',     StampStoreController.adminChangeCode);
router.patch('/stampstore/markexchanged',  StampStoreController.adminMarkExchanged);

module.exports = router;
