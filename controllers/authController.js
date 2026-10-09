const authService = require('../services/authServices');
const passkeyService = require('../services/passkeyServices');

exports.register = async (req, res, next) => {
    try {
        const result = await authService.register(req.body, req);
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
};

exports.login = async (req, res, next) => {
    try {
        const result = await authService.login(req.body, req);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

exports.logout = async (req, res, next) => {
    try {
        const result = await authService.logout(req.user, req);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

exports.forgotPassword = async (req, res, next) => {
    try {
        await authService.forgotPassword(req.body.email, req);
        res.json({ message: 'If that email is registered, a reset link has been sent' });
    } catch (err) {
        next(err);
    }
};

exports.resetPassword = async (req, res, next) => {
    try {
        const result = await authService.resetPassword(req.body.token, req.body.newPassword, req);
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

exports.passkeyRegistrationOptions = async (req, res, next) => {
    try {
        const result = await passkeyService.registrationOptions(req.user);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

exports.passkeyRegistrationVerify = async (req, res, next) => {
    try {
        const passkey = await passkeyService.verifyRegistration(req.user, req.body, req);
        res.status(201).json(passkey);
    } catch (err) {
        next(err);
    }
};

exports.passkeyLoginOptions = async (req, res, next) => {
    try {
        const result = await passkeyService.authenticationOptions(req.body);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

exports.passkeyLoginVerify = async (req, res, next) => {
    try {
        const result = await passkeyService.verifyAuthentication(req.body, req);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

exports.listPasskeys = async (req, res, next) => {
    try {
        const passkeys = await passkeyService.listPasskeys(req.user._id);
        res.json(passkeys);
    } catch (err) {
        next(err);
    }
};

exports.deletePasskey = async (req, res, next) => {
    try {
        const result = await passkeyService.deletePasskey(req.user._id, req.params.id, req);
        res.json(result);
    } catch (err) {
        next(err);
    }
};
