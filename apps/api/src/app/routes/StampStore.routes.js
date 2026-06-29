const express              = require('express');
const router               = express.Router();
const AuthMiddleware       = require('../middleware/Auth.middleware');
const StampStoreController = require('../controllers/StampStore.controller');

// GET  /stampstore
router.get('/', AuthMiddleware.requireAuth, StampStoreController.listStores);

// POST /stampstore/createstamp
router.post('/createstamp', AuthMiddleware.requireAuth, StampStoreController.createStamp);

module.exports = router;
