// validation/authValidation.js
const Joi = require("joi");

exports.registerValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(128).required(),
    fingerprintId: Joi.string().alphanum().min(6).required(),
  });
  return schema.validate(data);
};

exports.loginValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });
  return schema.validate(data);
};

exports.fingerprintValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    fingerprintId: Joi.string().alphanum().required(),
  });
  return schema.validate(data);
};

exports.forgotPasswordValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
  });
  return schema.validate(data);
};

exports.resetPasswordValidation = (data) => {
  const schema = Joi.object({
    token: Joi.string().required(),
    newPassword: Joi.string().min(8).max(128).required(),
  });
  return schema.validate(data);
};
