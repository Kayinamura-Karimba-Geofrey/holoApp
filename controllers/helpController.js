const helpService = require('../services/helpServices');
const { parsePagination } = require('../utils/pagination');

exports.getAllArticles = async (req, res, next) => {
    try {
        const articles = await helpService.getAllArticles(parsePagination(req.query));
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
        const article = await helpService.createArticle(req.body, req.user._id);
        res.status(201).json(article);
    } catch (err) {
        next(err);
    }
};

exports.updateArticle = async (req, res, next) => {
    try {
        const article = await helpService.updateArticle(req.params.id, req.body, req.user._id);
        res.json(article);
    } catch (err) {
        next(err);
    }
};

exports.deleteArticle = async (req, res, next) => {
    try {
        const result = await helpService.deleteArticle(req.params.id, req.user._id);
        res.json(result);
    } catch (err) {
        next(err);
    }
};
