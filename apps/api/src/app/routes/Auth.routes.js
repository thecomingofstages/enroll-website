const express        = require('express');
const router         = express.Router();
const AuthMiddleware = require('../middleware/Auth.middleware');
const AuthController = require('../controllers/Auth.controller');

// POST /auth/register
router.post('/register', AuthController.register);

// POST /auth/login
router.post('/login', AuthController.login);

// POST /auth/logout
router.post('/logout', AuthMiddleware.requireAuth, AuthController.logout);

// POST /auth/otp/send
router.post('/otp/send', AuthController.sendOtp);

// POST /auth/otp/verify
router.post('/otp/verify', AuthController.verifyOtp);

module.exports = router;
