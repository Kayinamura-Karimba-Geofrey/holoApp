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
        const result = await authService.login(req.body);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

exports.logout = async (req, res, next) => {
    try {
        const result = await authService.logout(req.user);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

exports.fingerprintLogin = async (req, res, next) => {
    try {
        const result = await authService.fingerprintLogin(req.body);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

exports.forgotPassword = async (req, res, next) => {
    try {
        await authService.forgotPassword(req.body.email);
        res.json({ message: 'If that email is registered, a reset link has been sent' });
    } catch (err) {
        next(err);
    }
};

exports.resetPassword = async (req, res, next) => {
    try {
        const result = await authService.resetPassword(req.body.token, req.body.newPassword);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

exports.refreshToken = async (req, res, next) => {
    try {
        const tokens = await authService.refreshToken(req.body.refreshToken);
        res.json(tokens);
    } catch (err) {
        next(err);
    }
};
