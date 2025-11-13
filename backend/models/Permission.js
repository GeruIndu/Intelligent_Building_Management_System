// models/Permission.js
const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    space: { type: mongoose.Schema.Types.ObjectId, ref: 'Space', required: true },
    canEnter: { type: Boolean, default: true },      // primary flag
    canManage: { type: Boolean, default: false },    // optional: allow managing space settings
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // admin who granted
    revoked: { type: Boolean, default: false },      // soft-revoke flag
    revokedAt: { type: Date },
    expiresAt: { type: Date }                        // optional expiration
}, { timestamps: true });

// optional unique index to prevent duplicates
permissionSchema.index({ user: 1, space: 1 });
permissionSchema.index({ user: 1, revoked: 1, expiresAt: 1 });

module.exports = mongoose.model('Permission', permissionSchema);
