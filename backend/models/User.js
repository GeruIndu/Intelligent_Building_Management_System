// models/User.js
const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    name: {
        type: String
    },
    email: {
        type: String,
        unique: true,
        sparse: true
    },
    contact: {
        type: String
    },
    passwordHash: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'manager', 'user'],
        default: 'user'
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
