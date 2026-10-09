// validations/vrValidation.js
const Joi = require("joi");

const deviceFields = {
  name: Joi.string().trim().min(1).max(100),
  type: Joi.string().valid("VR", "AR", "holo"),
};

const sceneFields = {
  name: Joi.string().trim().min(3).max(100),
  description: Joi.string().max(1000).allow(""),
  assetUrl: Joi.string().uri({ scheme: ["https", "http"] }).allow(""),
};

exports.createDeviceSchema = Joi.object({
  name: deviceFields.name.required(),
  type: deviceFields.type.optional(),
});

exports.updateDeviceSchema = Joi.object(deviceFields).min(1);

exports.configSchema = Joi.object({
  deviceId: Joi.string().hex().length(24).required(),
  settings: Joi.object().required(),
});

exports.createSceneSchema = Joi.object({
  name: sceneFields.name.required(),
  description: sceneFields.description.optional(),
  assetUrl: sceneFields.assetUrl.optional(),
});

exports.updateSceneSchema = Joi.object(sceneFields).min(1);
