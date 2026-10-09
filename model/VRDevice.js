const mongoose = require('mongoose');

const vrDeviceSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['VR', 'AR', 'holo'], default: 'holo' },
    status: { type: String, enum: ['connected', 'disconnected'], default: 'disconnected' },
    ipAddress: { type: String, default: '' },
    config: { type: Object, default: {} },
    // SHA-256 of the key the device uses to open its WebSocket connection.
    keyHash: { type: String, required: true, select: false },
    lastSeenAt: { type: Date }
}, { timestamps: true });

vrDeviceSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.keyHash;
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('VRDevice', vrDeviceSchema);
