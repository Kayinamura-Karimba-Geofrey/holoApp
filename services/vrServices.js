const crypto = require('crypto');
const VRDevice = require('../model/VRDevice');
const VRScene = require('../model/VRScene');
const AppError = require('../utils/AppError');
const vrSocket = require('./vrSocket');
const audit = require('./auditService');

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

exports.getDevices = async () => await VRDevice.find().sort({ name: 1 });

// The device key is returned once, here; only its hash is stored.
exports.createDevice = async ({ name, type }, userId) => {
  const deviceKey = crypto.randomBytes(32).toString('hex');
  const device = await VRDevice.create({ name, type, keyHash: sha256(deviceKey) });
  await audit.log('vr.device_created', { userId, deviceId: device._id });
  return { device, deviceKey };
};

exports.updateDevice = async (id, data, userId) => {
  const device = await VRDevice.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  if (!device) throw new AppError('Device not found', 404);
  await audit.log('vr.device_updated', { userId, deviceId: id, changes: data });
  return device;
};

exports.deleteDevice = async (id, userId) => {
  const device = await VRDevice.findByIdAndDelete(id);
  if (!device) throw new AppError('Device not found', 404);
  vrSocket.disconnect(id);
  await audit.log('vr.device_deleted', { userId, deviceId: id });
  return { message: 'Device deleted' };
};

exports.sendConfig = async ({ deviceId, settings }, userId) => {
  const device = await VRDevice.findByIdAndUpdate(deviceId, { $set: { config: settings } }, { new: true });
  if (!device) throw new AppError('Device not found', 404);
  // Offline devices receive the saved config when they next connect.
  const delivered = vrSocket.push(deviceId, { type: 'config', settings });
  await audit.log('vr.config_sent', { userId, deviceId, delivered });
  return {
    message: delivered ? 'Configuration applied to device' : 'Device offline; configuration will apply when it reconnects',
    delivered,
    device
  };
};

exports.getScenes = async () => VRScene.find().sort({ name: 1 });

exports.getSceneById = async (id) => {
  const scene = await VRScene.findById(id);
  if (!scene) throw new AppError('Scene not found', 404);
  return scene;
};

exports.createScene = async (data) => VRScene.create(data);

exports.updateScene = async (id, data) => {
  const scene = await VRScene.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  if (!scene) throw new AppError('Scene not found', 404);
  return scene;
};

exports.deleteScene = async (id) => {
  const scene = await VRScene.findByIdAndDelete(id);
  if (!scene) throw new AppError('Scene not found', 404);
  return { message: 'Scene deleted' };
};
