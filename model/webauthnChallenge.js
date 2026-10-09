const mongoose = require('mongoose');

// Short-lived WebAuthn challenges; MongoDB deletes them once expired.
const webauthnChallengeSchema = new mongoose.Schema({
    challenge: { type: String, required: true },
    type: { type: String, enum: ['registration', 'authentication'], required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    expiresAt: { type: Date, required: true, expires: 0 }
});

module.exports = mongoose.model('WebauthnChallenge', webauthnChallengeSchema);
