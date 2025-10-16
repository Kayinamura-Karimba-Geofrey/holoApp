const express = require('express');
const router = express.Router();
const operationsController = require('../controllers/operationsControllers');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.get('/stats', authMiddleware, adminMiddleware, operationsController.getStats);
router.get('/system-status', authMiddleware, adminMiddleware, operationsController.getSystemStatus);
router.get('/logs', authMiddleware, adminMiddleware, operationsController.getLogs);
router.delete('/logs', authMiddleware, adminMiddleware, operationsController.clearLogs);

module.exports = router;
