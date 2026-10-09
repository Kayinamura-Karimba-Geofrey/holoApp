const express = require('express');
const router = express.Router();
const vrController = require('../controllers/vrController');
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { configSchema, sceneIdSchema } = require('../validations/vrValidation');

router.use(authMiddleware);

router.get('/devices', vrController.getDevices);
router.post('/config', validate(configSchema), vrController.sendConfig);
router.get('/scenes', vrController.getScenes);
router.get('/scenes/:id', validate(sceneIdSchema, 'params'), vrController.getSceneById);

module.exports = router;
