const settingsService = require('../services/settingsServices');

exports.getSystemSettings = async (req, res, next) => {
    try {
        const settings = await settingsService.getSystemSettings();
        res.json(settings);
    } catch (err) {
        next(err);
    }
};

exports.updateSystemSettings = async (req, res, next) => {
    try {
        const settings = await settingsService.updateSystemSettings(req.body, req.user._id);
        res.json(settings);
    } catch (err) {
        next(err);
    }
};

exports.getThemes = async (req, res, next) => {
    try {
        const themes = await settingsService.getThemes(req.user);
        res.json(themes);
    } catch (err) {
        next(err);
    }
};

exports.updateTheme = async (req, res, next) => {
    try {
        const theme = await settingsService.updateTheme(req.user._id, req.body.theme);
        res.json(theme);
    } catch (err) {
        next(err);
    }
};
