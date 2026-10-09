const mongoose = require('mongoose');

const systemLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    details: { type: Object, default: {} }
}, { timestamps: true });

systemLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SystemLog', systemLogSchema);
