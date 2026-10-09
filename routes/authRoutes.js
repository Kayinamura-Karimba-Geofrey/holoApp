const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const v = require('../validations/authValidation');
const { objectIdParamSchema } = require('../validations/commonValidation');

router.post('/register', authLimiter, validate(v.registerSchema), authController.register);
router.post('/login', authLimiter, validate(v.loginSchema), authController.login);
router.post('/logout', authMiddleware, authController.logout);
router.post('/forgot-password', authLimiter, validate(v.forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authLimiter, validate(v.resetPasswordSchema), authController.resetPassword);
router.post('/refresh-token', validate(v.refreshTokenSchema), authController.refreshToken);

// Passkeys (WebAuthn)
router.post('/passkeys/register/options', authMiddleware, authController.passkeyRegistrationOptions);
router.post('/passkeys/register/verify', authMiddleware, validate(v.passkeyRegisterVerifySchema), authController.passkeyRegistrationVerify);
router.post('/passkeys/login/options', authLimiter, validate(v.passkeyLoginOptionsSchema), authController.passkeyLoginOptions);
router.post('/passkeys/login/verify', authLimiter, validate(v.passkeyLoginVerifySchema), authController.passkeyLoginVerify);
router.get('/passkeys', authMiddleware, authController.listPasskeys);
router.delete('/passkeys/:id', authMiddleware, validate(objectIdParamSchema, 'params'), authController.deletePasskey);

module.exports = router;
