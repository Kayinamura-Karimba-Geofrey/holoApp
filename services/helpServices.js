const HelpArticle = require('../model/helpArticle');
const AppError = require('../utils/AppError');
const { paginate } = require('../utils/pagination');
const audit = require('./auditService');

exports.getAllArticles = async (pagination) => paginate(HelpArticle, {}, pagination);

exports.getArticleById = async (id) => {
  const article = await HelpArticle.findById(id);
  if (!article) throw new AppError('Article not found', 404);
  return article;
};

exports.createArticle = async (data, userId) => {
  const article = await HelpArticle.create({ ...data, createdBy: userId });
  await audit.log('help.article_created', { userId, articleId: article._id });
  return article;
};

exports.updateArticle = async (id, data, userId) => {
  const updated = await HelpArticle.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!updated) throw new AppError('Article not found', 404);
  await audit.log('help.article_updated', { userId, articleId: id });
  return updated;
};

exports.deleteArticle = async (id, userId) => {
  const deleted = await HelpArticle.findByIdAndDelete(id);
  if (!deleted) throw new AppError('Article not found', 404);
  await audit.log('help.article_deleted', { userId, articleId: id });
  return { message: 'Article deleted' };
};
