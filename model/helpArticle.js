const mongoose = require('mongoose');

const helpArticleSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    category: { type: String, default: 'general', trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Used by Holobot to find articles relevant to a user's question.
helpArticleSchema.index({ title: 'text', content: 'text' }, { weights: { title: 3, content: 1 } });

module.exports = mongoose.model('HelpArticle', helpArticleSchema);
