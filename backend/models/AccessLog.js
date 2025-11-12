// models/AccessLog.js
const mongoose = require('mongoose');

const accessLogSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    space: { type: mongoose.Schema.Types.ObjectId, ref: 'Space', required: true },
    floor: { type: mongoose.Schema.Types.ObjectId, ref: 'Floor' },
    entryTime: { type: Date, required: true, default: Date.now },
    exitTime: { type: Date },
    accessGrant: { type: Boolean, default: true },
    notes: { type: String },

    // NEW: last time we saw the client for this open session (heartbeat)
    lastSeen: { type: Date, default: Date.now }
}, { timestamps: true });

accessLogSchema.index({ user: 1, space: 1, entryTime: -1 });
accessLogSchema.index({ exitTime: 1 });
accessLogSchema.index({ lastSeen: 1 });

module.exports = mongoose.model('AccessLog', accessLogSchema);
