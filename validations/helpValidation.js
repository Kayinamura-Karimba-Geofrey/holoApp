// validation/helpValidation.js
const Joi = require("joi");

exports.articleValidation = (data) => {
  const schema = Joi.object({
    title: Joi.string().min(3).max(150).required(),
    content: Joi.string().min(10).required(),
    category: Joi.string().optional(),
    author: Joi.string().optional(),
  });
  return schema.validate(data);
};
