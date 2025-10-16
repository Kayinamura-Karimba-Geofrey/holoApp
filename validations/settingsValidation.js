// validation/settingsValidation.js
const Joi = require("joi");

exports.systemSettingsValidation = (data) => {
  const schema = Joi.object({
    maintenanceMode: Joi.boolean().optional(),
    appVersion: Joi.string().optional(),
    maxUsers: Joi.number().min(1).optional(),
  });
  return schema.validate(data);
};

exports.themeSettingsValidation = (data) => {
  const schema = Joi.object({
    theme: Joi.string().valid("light", "dark", "holo", "neon").required(),
  });
  return schema.validate(data);
};

