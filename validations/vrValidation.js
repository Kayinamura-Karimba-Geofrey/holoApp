// validation/vrValidation.js
const Joi = require("joi");

exports.deviceValidation = (data) => {
  const schema = Joi.object({
    deviceName: Joi.string().required(),
    deviceType: Joi.string().valid("VR", "AR", "Holographic").required(),
    connectionId: Joi.string().alphanum().required(),
  });
  return schema.validate(data);
};

exports.sceneValidation = (data) => {
  const schema = Joi.object({
    sceneName: Joi.string().min(3).max(100).required(),
    sceneUrl: Joi.string().uri().required(),
  });
  return schema.validate(data);
};
