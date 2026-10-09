const VRDevice = require('../model/VRDevice');
const AppError = require('../utils/AppError');

const SCENES = [
  { id: 1, name: 'Solar System Arena' },
  { id: 2, name: 'Holofabric Lab' },
];

exports.getDevices = async () => await VRDevice.find();

exports.sendConfig = async ({ deviceId, settings }) => {
  const device = await VRDevice.findByIdAndUpdate(deviceId, { $set: { config: settings } }, { new: true });
  if (!device) throw new AppError('Device not found', 404);
  // TODO: push the configuration to the physical device once a transport exists.
  return { message: 'Configuration applied to device', device };
};

exports.getScenes = async () => SCENES;

exports.getSceneById = async (id) => {
  const scene = SCENES.find(s => s.id === id);
  if (!scene) throw new AppError('Scene not found', 404);
  return scene;
};
