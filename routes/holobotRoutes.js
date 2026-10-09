const express = require('express');
const router = express.Router();
const holobotController = require('../controllers/holobotController');
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { chatSchema, settingsSchema } = require('../validations/holobotValidation');

router.use(authMiddleware);

router.post('/chat', validate(chatSchema), holobotController.chat);
router.post('/chat/stream', validate(chatSchema), holobotController.chatStream);
router.get('/usage', holobotController.getUsage);
router.get('/history', holobotController.getHistory);
router.delete('/clear', holobotController.clearHistory);
router.get('/settings', holobotController.getSettings);
router.put('/settings', validate(settingsSchema), holobotController.updateSettings);

module.exports = router;
