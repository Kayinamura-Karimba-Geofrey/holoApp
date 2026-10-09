// validations/holobotValidation.js
const Joi = require("joi");
const { AI_TONES } = require("../utils/constants");

exports.chatSchema = Joi.object({
  message: Joi.string().trim().min(1).max(2000).required(),
  context: Joi.string().max(100).optional(),
});

exports.settingsSchema = Joi.object({
  tone: Joi.string().valid(...AI_TONES).optional(),
  temperature: Joi.number().min(0).max(1).optional(),
}).min(1);
