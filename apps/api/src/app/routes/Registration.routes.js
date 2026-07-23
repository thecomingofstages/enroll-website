const express                = require('express');
const router                 = express.Router();
const AuthMiddleware         = require('../middleware/Auth.middleware');
const UploadMiddleware       = require('../middleware/Upload.middleware');
const RegistrationController = require('../controllers/Registration.controller');
const PaymentController      = require('../controllers/Payment.controller');

// POST /registrations
// optionalAuth: existing users send Bearer token, new users send new_user payload without token
router.post('/', AuthMiddleware.optionalAuth, RegistrationController.create);

// GET  /registrations/mine — user's own registrations (for payment retry flow)
router.get('/mine', AuthMiddleware.requireAuth, RegistrationController.getMyRegistrations);

// GET  /registrations/:id
router.get('/:id', AuthMiddleware.requireAuth, RegistrationController.getById);

// POST /registrations/preview — slip QR pre-check, no DB writes.
// Reachable by guests (no auth required): called BEFORE the user account
// exists, so there's nothing to authorize against. Mounted BEFORE
// /:id/payment so the literal "preview" segment cannot be captured by
// the dynamic :id route.
router.post('/preview', UploadMiddleware.handleSlip, PaymentController.previewSlip);

// POST /registrations/:id/payment  — multipart/form-data, field: slip
// optionalAuth: the slip upload is reachable from the new-user registration flow
// (the access_token returned by POST /registrations is sent here immediately) and
// from the logged-in "resume payment" flow. Use optionalAuth so a transient token
// issue doesn't strand a freshly-created user; ownership is verified inside the
// controller against the registration's user_id.
router.post('/:id/payment', AuthMiddleware.optionalAuth, UploadMiddleware.handleSlip, PaymentController.verifySlip);

module.exports = router;
