const express        = require('express');
const router         = express.Router();
const AuthMiddleware = require('../middleware/Auth.middleware');
const UserController = require('../controllers/User.controller');

// GET  /users/me
router.get('/me', AuthMiddleware.requireAuth, UserController.getMe);

// PATCH /users/me
router.patch('/me', AuthMiddleware.requireAuth, UserController.updateMe);

// GET  /users/me/activities
router.get('/me/activities', AuthMiddleware.requireAuth, UserController.getMyActivities);

// GET  /users/me/qr
router.get('/me/qr', AuthMiddleware.requireAuth, UserController.getQrToken);

module.exports = router;
