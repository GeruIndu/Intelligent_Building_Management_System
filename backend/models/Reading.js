// models/Reading.js
const mongoose = require('mongoose');
const readingSchema = new mongoose.Schema({
    device: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Device',
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    metrics: mongoose.Mixed // e.g., {temperature: 24.5, humidity: 45}
}, { timestamps: true });

module.exports = mongoose.model('Reading', readingSchema);
