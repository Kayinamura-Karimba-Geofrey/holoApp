const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, default: '' },
    avatar: { type: String, default: '' },
    preferences: {
        theme: { type: String, default: 'dark' },
        aiTone: { type: String, default: 'friendly' }
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
