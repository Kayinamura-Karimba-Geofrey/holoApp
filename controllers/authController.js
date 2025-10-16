const authService = require('../services/authServices');

exports.register = async (req, res, next) => {
    try {
        const result = await authService.register(req.body);
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
};

exports.login = async (req, res, next) => {
    try {
        const token = await authService.login(req.body);
        res.json(token);
    } catch (err) {
        next(err);
    }
};

exports.logout = async (req, res, next) => {
    try {
        await authService.logout(req.user);
        res.json({ message: 'Logged out successfully' });
    } catch (err) {
        next(err);
    }
};

exports.fingerprintLogin = async (req, res, next) => {
    try {
        const token = await authService.fingerprintLogin(req.body.fingerprintId);
        res.json(token);
    } catch (err) {
        next(err);
    }
};

exports.forgotPassword = async (req, res, next) => {
    try {
        await authService.forgotPassword(req.body.email);
        res.json({ message: 'Reset link sent' });
    } catch (err) {
        next(err);
    }
};

exports.resetPassword = async (req, res, next) => {
    try {
        await authService.resetPassword(req.body.token, req.body.newPassword);
        res.json({ message: 'Password reset successful' });
    } catch (err) {
        next(err);
    }
};

exports.refreshToken = async (req, res, next) => {
    try {
        const newToken = await authService.refreshToken(req.body.refreshToken);
        res.json(newToken);
    } catch (err) {
        next(err);
    }
};
