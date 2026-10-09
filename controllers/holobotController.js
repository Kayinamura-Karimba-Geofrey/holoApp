const holobotService = require('../services/holobotServices');
const { parsePagination } = require('../utils/pagination');

exports.chat = async (req, res, next) => {
    try {
        const response = await holobotService.sendMessage(req.user, req.body);
        res.json(response);
    } catch (err) {
        next(err);
    }
};

exports.getHistory = async (req, res, next) => {
    try {
        const history = await holobotService.getHistory(req.user._id, parsePagination(req.query));
        res.json(history);
    } catch (err) {
        next(err);
    }
};

exports.clearHistory = async (req, res, next) => {
    try {
        const result = await holobotService.clearHistory(req.user._id);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

exports.getSettings = async (req, res, next) => {
    try {
        const settings = await holobotService.getSettings(req.user);
        res.json(settings);
    } catch (err) {
        next(err);
    }
};

exports.updateSettings = async (req, res, next) => {
    try {
        const settings = await holobotService.updateSettings(req.user._id, req.body);
        res.json(settings);
    } catch (err) {
        next(err);
    }
};
