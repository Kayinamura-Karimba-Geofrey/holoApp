const mongoose = require('mongoose');

const chatHistorySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    message: { type: String, required: true },
    response: { type: String, required: true },
    context: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
