const mongoose = require('mongoose');

const vrDeviceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, default: 'holo' },
    status: { type: String, default: 'disconnected' },
    ipAddress: { type: String, default: '' },
    config: { type: Object, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('VRDevice', vrDeviceSchema);
