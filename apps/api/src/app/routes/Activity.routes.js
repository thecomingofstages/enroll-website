const express            = require('express');
const router             = express.Router();
const AuthMiddleware     = require('../middleware/Auth.middleware');
const ActivityController = require('../controllers/Activity.controller');

// NOTE: /recommended must be declared BEFORE /:id to avoid Express matching "recommended" as an id param
// GET  /activities
router.get('/', ActivityController.list);

// GET  /activities/recommended
router.get('/recommended', AuthMiddleware.requireAuth, ActivityController.getRecommended);

// GET  /activities/:id
router.get('/:id', ActivityController.getById);

module.exports = router;
