const operationsService = require('../services/operationsServices');

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
        const logs = await operationsService.getLogs();
        res.json(logs);
    } catch (err) {
        next(err);
    }
};

exports.clearLogs = async (req, res, next) => {
    try {
        await operationsService.clearLogs();
        res.json({ message: 'Logs cleared' });
    } catch (err) {
        next(err);
    }
};
