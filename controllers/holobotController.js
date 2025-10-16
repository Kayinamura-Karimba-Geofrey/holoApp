const holobotService = require('../services/holobotServices');

exports.chat = async (req, res, next) => {
    try {
        const response = await holobotService.sendMessage(req.user.id, req.body);
        res.json(response);
    } catch (err) {
        next(err);
    }
};

exports.getHistory = async (req, res, next) => {
    try {
        const history = await holobotService.getHistory(req.user.id);
        res.json(history);
    } catch (err) {
        next(err);
    }
};

exports.clearHistory = async (req, res, next) => {
    try {
        await holobotService.clearHistory(req.user.id);
        res.json({ message: 'Chat history cleared' });
    } catch (err) {
        next(err);
    }
};

exports.getSettings = async (req, res, next) => {
    try {
        const settings = await holobotService.getSettings(req.user.id);
        res.json(settings);
    } catch (err) {
        next(err);
    }
};

exports.updateSettings = async (req, res, next) => {
    try {
        const settings = await holobotService.updateSettings(req.user.id, req.body);
        res.json(settings);
    } catch (err) {
        next(err);
    }
};
     