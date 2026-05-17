const express        = require('express');
const router         = express.Router();
const AuthMiddleware = require('../middleware/Auth.middleware');
const EventController = require('../controllers/Event.controller');

// POST /events/scan — admin or staff only
router.post('/scan', AuthMiddleware.requireAdmin, EventController.scan);

module.exports = router;
