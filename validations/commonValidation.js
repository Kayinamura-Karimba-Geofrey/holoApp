// validations/commonValidation.js
const Joi = require("joi");

exports.objectIdParamSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
});
