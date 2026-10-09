const mongoose = require('mongoose');

const fingerprintSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // SHA-256 of the fingerprint id; the raw value is never stored.
    fingerprintHash: { type: String, required: true, unique: true }
}, { timestamps: true });

module.exports = mongoose.model('Fingerprint', fingerprintSchema);
