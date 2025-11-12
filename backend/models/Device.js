// models/Device.js
const mongoose = require('mongoose');
const deviceSchema = new mongoose.Schema({
    name: String,
    type: String, // e.g., "temperature", "co2", "motion"
    location: {
        zone: String,
        room: String
    },
    status: {
        type: String,
        default: 'active'
    },
    meta: mongoose.Mixed
}, { timestamps: true });

module.exports = mongoose.model('Device', deviceSchema);
