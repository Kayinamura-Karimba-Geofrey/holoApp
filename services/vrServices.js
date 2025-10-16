const VRDevice = require('../model/VRDevice');

exports.getDevices = async () => await VRDevice.find();

exports.sendConfig = async (config) => {
  // Simulate sending config to connected VR device
  console.log('Sending VR configuration:', config);
  return { message: 'Configuration applied to device' };
};

exports.getScenes = async () => [
  { id: 1, name: 'Solar System Arena' },
  { id: 2, name: 'Holofabric Lab' },
];

exports.getSceneById = async (id) => {
  const scenes = await exports.getScenes();
  const scene = scenes.find(s => s.id === parseInt(id));
  if (!scene) throw new Error('Scene not found');
  return scene;
};
