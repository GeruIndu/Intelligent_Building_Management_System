// models/AccessLog.js
const mongoose = require('mongoose');
const accessLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    space: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Space',
        required: true
    },
    floor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Floor'
    }, // optional denormalized
    entryTime: {
        type: Date,
        required: true,
        default: Date.now
    },
    exitTime: {
        type: Date
    },
    accessGrant: {
        type: Boolean,
        default: true
    },
    notes: {
        type: String
    }
}, { timestamps: true });

accessLogSchema.index({ user: 1, entryTime: -1 });
accessLogSchema.index({ space: 1, entryTime: -1 });

module.exports = mongoose.model('AccessLog', accessLogSchema);
