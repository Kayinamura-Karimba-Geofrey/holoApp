// validations/helpValidation.js
const Joi = require("joi");

const fields = {
  title: Joi.string().trim().min(3).max(150),
  content: Joi.string().min(10).max(50000),
  category: Joi.string().trim().max(50),
};

exports.createArticleSchema = Joi.object({
  title: fields.title.required(),
  content: fields.content.required(),
  category: fields.category.optional(),
});

exports.updateArticleSchema = Joi.object(fields).min(1);
