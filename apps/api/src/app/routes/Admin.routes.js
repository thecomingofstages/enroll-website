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
// POST /admin/activities  
router.post('/activities',     UploadMiddleware.handleActivityImage, ActivityController.create);

// PATCH /admin/activities/:id 
router.patch('/activities/:id', UploadMiddleware.handleActivityImage, ActivityController.update);

// DELETE /admin/activities/:id
router.delete('/activities/:id', ActivityController.remove);

// POST /admin/activities/:id/export 
router.post('/activities/:id/export', EventController.exportToSheets);

// ── Registration management ────────────────────────────────────────────────────
// GET  /admin/registrations
router.get('/registrations', RegistrationController.adminList);

// PATCH /admin/registrations/:id/status
router.patch('/registrations/:id/status', RegistrationController.adminUpdateStatus);

module.exports = router;
