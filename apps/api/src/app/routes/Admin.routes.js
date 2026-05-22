const express                = require('express');
const router                 = express.Router();
const AuthMiddleware         = require('../middleware/Auth.middleware');
const UploadMiddleware       = require('../middleware/Upload.middleware');
const ActivityController     = require('../controllers/Activity.controller');
const RegistrationController = require('../controllers/Registration.controller');
const EventController        = require('../controllers/Event.controller');

// All admin routes require admin role
router.use(AuthMiddleware.requireAdmin);

// ── Activity CRUD ──────────────────────────────────────────────────────────────
router.post('/activities',      UploadMiddleware.handleActivityImage, ActivityController.create);
router.patch('/activities/:id', UploadMiddleware.handleActivityImage, ActivityController.update);
router.delete('/activities/:id', ActivityController.remove);

// POST /admin/activities/:id/export — returns .xlsx download
router.post('/activities/:id/export', EventController.exportActivity);

// ── Registration management ────────────────────────────────────────────────────
router.get('/registrations',               RegistrationController.adminList);
router.patch('/registrations/:id/status',  RegistrationController.adminUpdateStatus);

module.exports = router;
