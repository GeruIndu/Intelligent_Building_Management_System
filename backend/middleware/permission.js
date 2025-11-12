// checks/permission.js
const Permission = require('../models/Permission');
const mongoose = require('mongoose');

async function findActivePermissionsForUser(userId) {
    const now = new Date();
    return Permission.find({
        user: userId,
        revoked: false,
        canEnter: true,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }]
    }).populate({ path: 'space', select: '_id floor spaceName' }).lean();
}

async function checkUserCanEnter(userId, spaceId) {
    const now = new Date();
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(spaceId)) return false;
    const perm = await Permission.findOne({
        user: userId,
        space: spaceId,
        revoked: false,
        canEnter: true,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }]
    });
    return !!perm;
}

module.exports = { findActivePermissionsForUser, checkUserCanEnter };
