const mongoose = require('mongoose');

// A WebAuthn credential (passkey, Touch ID, Windows Hello, security key).
const passkeySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    credentialId: { type: String, required: true, unique: true },
    publicKey: { type: Buffer, required: true },
    counter: { type: Number, default: 0 },
    transports: { type: [String], default: [] },
    deviceType: { type: String },
    backedUp: { type: Boolean, default: false },
    name: { type: String, default: 'Passkey', trim: true },
    lastUsedAt: { type: Date }
}, { timestamps: true });

passkeySchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.publicKey;
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Passkey', passkeySchema);
