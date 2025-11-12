// models/Floor.js
const mongoose = require('mongoose');
const floorSchema = new mongoose.Schema({
    floornumber: {
        type: String,
        required: true
    },
    description: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Floor', floorSchema);
