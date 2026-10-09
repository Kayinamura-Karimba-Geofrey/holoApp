const mongoose = require('mongoose');

// Single-document collection holding app-wide settings.
const systemSettingSchema = new mongoose.Schema({
    key: { type: String, default: 'global', unique: true, immutable: true },
    maintenanceMode: { type: Boolean, default: false },
    version: { type: String, default: '1.0.0' },
    maxUsers: { type: Number, min: 1 }
}, { timestamps: true });

module.exports = mongoose.model('SystemSetting', systemSettingSchema);
