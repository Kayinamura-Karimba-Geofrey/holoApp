const express = require('express');
const router = express.Router();
const vrController = require('../controllers/vrController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/devices', authMiddleware, vrController.getDevices);
router.post('/config', authMiddleware, vrController.sendConfig);
router.get('/scenes', authMiddleware, vrController.getScenes);
router.get('/scenes/:id', authMiddleware, vrController.getSceneById);

module.exports = router;
