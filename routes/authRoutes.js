const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const v = require('../validations/authValidation');

router.post('/register', authLimiter, validate(v.registerSchema), authController.register);
router.post('/login', authLimiter, validate(v.loginSchema), authController.login);
router.post('/fingerprint', authLimiter, validate(v.fingerprintSchema), authController.fingerprintLogin);
router.post('/logout', authMiddleware, authController.logout);
router.post('/forgot-password', authLimiter, validate(v.forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authLimiter, validate(v.resetPasswordSchema), authController.resetPassword);
router.post('/refresh-token', validate(v.refreshTokenSchema), authController.refreshToken);

module.exports = router;
