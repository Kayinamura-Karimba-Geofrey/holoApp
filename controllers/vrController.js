const vrService = require('../services/vrServices');

exports.getDevices = async (req, res, next) => {
    try {
        const devices = await vrService.getDevices();
        res.json(devices);
    } catch (err) {
        next(err);
    }
};

exports.sendConfig = async (req, res, next) => {
    try {
        const result = await vrService.sendConfig(req.body);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

exports.getScenes = async (req, res, next) => {
    try {
        const scenes = await vrService.getScenes();
        res.json(scenes);
    } catch (err) {
        next(err);
    }
};

exports.getSceneById = async (req, res, next) => {
    try {
        const scene = await vrService.getSceneById(req.params.id);
        res.json(scene);
    } catch (err) {
        next(err);
    }
};
