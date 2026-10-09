// validations/settingsValidation.js
const Joi = require("joi");
const { THEMES } = require("../utils/constants");

exports.systemSettingsSchema = Joi.object({
  maintenanceMode: Joi.boolean().optional(),
  version: Joi.string().max(20).optional(),
  maxUsers: Joi.number().integer().min(1).optional(),
}).min(1);

exports.themeSchema = Joi.object({
  theme: Joi.string().valid(...THEMES).required(),
});
