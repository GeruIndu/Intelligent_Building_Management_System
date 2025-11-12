// models/Alert.js
const mongoose = require('mongoose');
const alertSchema = new mongoose.Schema({
    device: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Device'
    },
    reading: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reading'
    },
    level: {
        type: String,
        enum: ['info', 'warning', 'critical'],
        default: 'warning'
    },
    message: String,
    resolved: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Alert', alertSchema);
