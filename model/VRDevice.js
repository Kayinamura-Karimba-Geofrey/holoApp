const mongoose = require('mongoose');

const vrDeviceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, default: 'holo' },
    status: { type: String, default: 'disconnected' },
    ipAddress: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date }
});

module.exports = mongoose.model('VRDevice', vrDeviceSchema);
