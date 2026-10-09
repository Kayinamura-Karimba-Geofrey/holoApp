const express = require('express');
const router = express.Router();
const vrController = require('../controllers/vrController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const validate = require('../middleware/validate');
const v = require('../validations/vrValidation');
const { objectIdParamSchema } = require('../validations/commonValidation');

const validId = validate(objectIdParamSchema, 'params');

router.use(authMiddleware);

router.get('/devices', vrController.getDevices);
router.post('/devices', adminMiddleware, validate(v.createDeviceSchema), vrController.createDevice);
router.put('/devices/:id', adminMiddleware, validId, validate(v.updateDeviceSchema), vrController.updateDevice);
router.delete('/devices/:id', adminMiddleware, validId, vrController.deleteDevice);
router.post('/config', validate(v.configSchema), vrController.sendConfig);

router.get('/scenes', vrController.getScenes);
router.get('/scenes/:id', validId, vrController.getSceneById);
router.post('/scenes', adminMiddleware, validate(v.createSceneSchema), vrController.createScene);
router.put('/scenes/:id', adminMiddleware, validId, validate(v.updateSceneSchema), vrController.updateScene);
router.delete('/scenes/:id', adminMiddleware, validId, vrController.deleteScene);

module.exports = router;
