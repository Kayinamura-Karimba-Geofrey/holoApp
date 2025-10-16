const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsControllers');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.get('/system', authMiddleware, adminMiddleware, settingsController.getSystemSettings);
router.put('/system', authMiddleware, adminMiddleware, settingsController.updateSystemSettings);
router.get('/theme', authMiddleware, settingsController.getThemes);
router.put('/theme', authMiddleware, adminMiddleware, settingsController.updateTheme);

module.exports = router;
