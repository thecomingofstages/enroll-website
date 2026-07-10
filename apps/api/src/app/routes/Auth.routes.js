const express        = require('express');
const router         = express.Router();
const AuthMiddleware = require('../middleware/Auth.middleware');
const AuthController = require('../controllers/Auth.controller');
const { forgotPasswordRateLimit } = require('../middleware/RateLimit.middleware');

// POST /auth/register
router.post('/register', AuthController.register);

// POST /auth/login
router.post('/login', AuthController.login);

// POST /auth/logout
router.post('/logout', AuthMiddleware.requireAuth, AuthController.logout);

// POST /auth/forgot-password
router.post('/forgot-password', forgotPasswordRateLimit, AuthController.forgotPassword);

// POST /auth/reset-password
router.post('/reset-password', AuthController.resetPassword);

// POST /auth/otp/send
router.post('/otp/send', AuthController.sendOtp);

// POST /auth/otp/verify
router.post('/otp/verify', AuthController.verifyOtp);

module.exports = router;
