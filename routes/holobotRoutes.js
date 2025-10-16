const express = require('express');
const router = express.Router();
const holobotController = require('../controllers/holobotController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/chat', authMiddleware, holobotController.chat);
router.get('/history', authMiddleware, holobotController.getHistory);
router.delete('/clear', authMiddleware, holobotController.clearHistory);
router.get('/settings', authMiddleware, holobotController.getSettings);
router.put('/settings', authMiddleware, holobotController.updateSettings);

module.exports = router;
