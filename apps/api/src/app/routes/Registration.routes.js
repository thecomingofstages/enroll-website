const express                = require('express');
const router                 = express.Router();
const AuthMiddleware         = require('../middleware/Auth.middleware');
const UploadMiddleware       = require('../middleware/Upload.middleware');
const RegistrationController = require('../controllers/Registration.controller');
const PaymentController      = require('../controllers/Payment.controller');

// POST /registrations
// optionalAuth: existing users send Bearer token, new users send new_user payload without token
router.post('/', AuthMiddleware.optionalAuth, RegistrationController.create);

// GET  /registrations/:id
router.get('/:id', AuthMiddleware.requireAuth, RegistrationController.getById);

// POST /registrations/:id/payment  — multipart/form-data, field: slip
router.post('/:id/payment', AuthMiddleware.requireAuth, UploadMiddleware.handleSlip, PaymentController.verifySlip);

module.exports = router;
