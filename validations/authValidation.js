// validations/authValidation.js
const Joi = require("joi");

const email = Joi.string().email().lowercase().trim().max(254);
const password = Joi.string().min(8).max(128);
const objectId = Joi.string().hex().length(24);

exports.registerSchema = Joi.object({
  email: email.required(),
  password: password.required(),
  name: Joi.string().trim().max(100).optional(),
});

exports.loginSchema = Joi.object({
  email: email.required(),
  password: Joi.string().max(128).required(),
});

exports.forgotPasswordSchema = Joi.object({
  email: email.required(),
});

exports.resetPasswordSchema = Joi.object({
  token: Joi.string().hex().length(64).required(),
  newPassword: password.required(),
});

exports.refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

// WebAuthn responses are verified by @simplewebauthn/server; here we only
// check the envelope so malformed requests fail fast.
const webauthnResponse = Joi.object({
  id: Joi.string().max(1024).required(),
}).unknown(true);

exports.passkeyRegisterVerifySchema = Joi.object({
  challengeId: objectId.required(),
  response: webauthnResponse.required(),
  name: Joi.string().trim().max(50).optional(),
});

exports.passkeyLoginOptionsSchema = Joi.object({
  email: email.optional(),
});

exports.passkeyLoginVerifySchema = Joi.object({
  challengeId: objectId.required(),
  response: webauthnResponse.required(),
});
