// validations/vrValidation.js
const Joi = require("joi");

exports.configSchema = Joi.object({
  deviceId: Joi.string().hex().length(24).required(),
  settings: Joi.object().required(),
});

exports.sceneIdSchema = Joi.object({
  id: Joi.number().integer().min(1).required(),
});
