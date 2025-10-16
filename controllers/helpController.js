const helpService = require('../services/helpServices');

exports.getAllArticles = async (req, res, next) => {
    try {
        const articles = await helpService.getAllArticles();
        res.json(articles);
    } catch (err) {
        next(err);
    }
};

exports.getArticleById = async (req, res, next) => {
    try {
        const article = await helpService.getArticleById(req.params.id);
        res.json(article);
    } catch (err) {
        next(err);
    }
};

exports.createArticle = async (req, res, next) => {
    try {
        const article = await helpService.createArticle(req.body);
        res.status(201).json(article);
    } catch (err) {
        next(err);
    }
};

exports.updateArticle = async (req, res, next) => {
    try {
        const article = await helpService.updateArticle(req.params.id, req.body);
        res.json(article);
    } catch (err) {
        next(err);
    }
};

exports.deleteArticle = async (req, res, next) => {
    try {
        await helpService.deleteArticle(req.params.id);
        res.json({ message: 'Article deleted' });
    } catch (err) {
        next(err);
    }
};
