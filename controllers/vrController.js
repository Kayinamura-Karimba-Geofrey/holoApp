const vrService = require('../services/vrServices');

// Wraps a service call so each handler is just "call service, send result".
const handle = (fn, status = 200) => async (req, res, next) => {
    try {
        res.status(status).json(await fn(req));
    } catch (err) {
        next(err);
    }
};

exports.getDevices = handle(() => vrService.getDevices());
exports.createDevice = handle((req) => vrService.createDevice(req.body, req.user._id), 201);
exports.updateDevice = handle((req) => vrService.updateDevice(req.params.id, req.body, req.user._id));
exports.deleteDevice = handle((req) => vrService.deleteDevice(req.params.id, req.user._id));
exports.sendConfig = handle((req) => vrService.sendConfig(req.body, req.user._id));

exports.getScenes = handle(() => vrService.getScenes());
exports.getSceneById = handle((req) => vrService.getSceneById(req.params.id));
exports.createScene = handle((req) => vrService.createScene(req.body), 201);
exports.updateScene = handle((req) => vrService.updateScene(req.params.id, req.body));
exports.deleteScene = handle((req) => vrService.deleteScene(req.params.id));
