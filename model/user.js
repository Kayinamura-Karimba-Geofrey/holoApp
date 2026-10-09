const mongoose = require('mongoose');
const { ROLES, THEMES, AI_TONES } = require('../utils/constants');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    name: { type: String, default: '' },
    avatar: { type: String, default: '' },
    role: { type: String, enum: ROLES, default: 'user' },
    preferences: {
        theme: { type: String, enum: THEMES, default: 'dark' },
        aiTone: { type: String, enum: AI_TONES, default: 'friendly' },
        aiTemperature: { type: Number, min: 0, max: 1, default: 0.8 }
    },
    // Bumped on logout / password reset to invalidate every issued token.
    tokenVersion: { type: Number, default: 0 },
    resetTokenHash: { type: String, select: false },
    resetTokenExpiry: { type: Date, select: false }
}, { timestamps: true });

userSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.password;
        delete ret.resetTokenHash;
        delete ret.resetTokenExpiry;
        delete ret.tokenVersion;
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('User', userSchema);
