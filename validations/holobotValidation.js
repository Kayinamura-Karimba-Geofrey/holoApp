// validation/holobotValidation.js
const Joi = require("joi");

exports.chatValidation = (data) => {
  const schema = Joi.object({
    message: Joi.string().min(1).max(2000).required(),
    context: Joi.string().max(100).optional(),
  });
  return schema.validate(data);
};

exports.settingsValidation = (data) => {
  const schema = Joi.object({
    model: Joi.string().valid("gpt-5", "gpt-4o", "groq-llama3").optional(),
    tone: Joi.string().valid("friendly", "formal", "concise", "creative").optional(),
    temperature: Joi.number().min(0).max(1).optional(),
  });
  return schema.validate(data);
};
