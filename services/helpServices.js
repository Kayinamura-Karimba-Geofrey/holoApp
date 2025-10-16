const HelpArticle = require('../model/helpArticle');

exports.getAllArticles = async () => await HelpArticle.find().sort({ createdAt: -1 });

exports.getArticleById = async (id) => {
  const article = await HelpArticle.findById(id);
  if (!article) throw new Error('Article not found');
  return article;
};

exports.createArticle = async (data, userId) => {
  return await HelpArticle.create({ ...data, createdBy: userId });
};

exports.updateArticle = async (id, data) => {
  const updated = await HelpArticle.findByIdAndUpdate(id, data, { new: true });
  if (!updated) throw new Error('Article not found');
  return updated;
};

exports.deleteArticle = async (id) => {
  const deleted = await HelpArticle.findByIdAndDelete(id);
  if (!deleted) throw new Error('Article not found');
  return { message: 'Article deleted' };
};
