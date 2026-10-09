const HelpArticle = require('../model/helpArticle');
const AppError = require('../utils/AppError');
const { paginate } = require('../utils/pagination');

exports.getAllArticles = async (pagination) => paginate(HelpArticle, {}, pagination);

exports.getArticleById = async (id) => {
  const article = await HelpArticle.findById(id);
  if (!article) throw new AppError('Article not found', 404);
  return article;
};

exports.createArticle = async (data, userId) => {
  return await HelpArticle.create({ ...data, createdBy: userId });
};

exports.updateArticle = async (id, data) => {
  const updated = await HelpArticle.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!updated) throw new AppError('Article not found', 404);
  return updated;
};

exports.deleteArticle = async (id) => {
  const deleted = await HelpArticle.findByIdAndDelete(id);
  if (!deleted) throw new AppError('Article not found', 404);
  return { message: 'Article deleted' };
};
