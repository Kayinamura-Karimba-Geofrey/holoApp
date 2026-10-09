const operationsService = require('../services/operationsServices');
const { parsePagination } = require('../utils/pagination');

exports.getStats = async (req, res, next) => {
    try {
        const stats = await operationsService.getStats();
        res.json(stats);
    } catch (err) {
        next(err);
    }
};

exports.getSystemStatus = async (req, res, next) => {
    try {
        const status = await operationsService.getSystemStatus();
        res.json(status);
    } catch (err) {
        next(err);
    }
};

exports.getLogs = async (req, res, next) => {
    try {
        const logs = await operationsService.getLogs(parsePagination(req.query));
        res.json(logs);
    } catch (err) {
        next(err);
    }
};

exports.clearLogs = async (req, res, next) => {
    try {
        const result = await operationsService.clearLogs(req.user._id);
        res.json(result);
    } catch (err) {
        next(err);
    }
};
