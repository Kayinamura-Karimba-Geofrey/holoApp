const mongoose = require('mongoose');

const helpArticleSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    category: { type: String, default: 'general', trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('HelpArticle', helpArticleSchema);
