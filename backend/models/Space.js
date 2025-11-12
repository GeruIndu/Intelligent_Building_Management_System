// models/Space.js
const mongoose = require('mongoose');
const spaceSchema = new mongoose.Schema({
    spaceName: {
        type: String,
        required: true
    },
    spaceType: {
        type: String
    },
    floor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Floor',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Space', spaceSchema);
