// validations/authValidation.js
const Joi = require("joi");

const email = Joi.string().email().lowercase().trim().max(254);
const password = Joi.string().min(8).max(128);
const fingerprintId = Joi.string().alphanum().min(6).max(256);

exports.registerSchema = Joi.object({
  email: email.required(),
  password: password.required(),
  name: Joi.string().trim().max(100).optional(),
  fingerprintId: fingerprintId.optional(),
});

exports.loginSchema = Joi.object({
  email: email.required(),
  password: Joi.string().max(128).required(),
});

exports.fingerprintSchema = Joi.object({
  email: email.required(),
  fingerprintId: fingerprintId.required(),
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
