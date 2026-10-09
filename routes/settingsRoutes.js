const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsControllers');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const validate = require('../middleware/validate');
const { systemSettingsSchema, themeSchema } = require('../validations/settingsValidation');

router.get('/system', authMiddleware, adminMiddleware, settingsController.getSystemSettings);
router.put('/system', authMiddleware, adminMiddleware, validate(systemSettingsSchema), settingsController.updateSystemSettings);
router.get('/theme', authMiddleware, settingsController.getThemes);
router.put('/theme', authMiddleware, validate(themeSchema), settingsController.updateTheme);

module.exports = router;
