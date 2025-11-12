// routes/dashboard.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Floor = require('../models/Floor');
const Space = require('../models/Space');
const AccessLog = require('../models/AccessLog');
const Permission = require('../models/Permission');
const { auth, permit } = require('../middleware/auth');
const { findActivePermissionsForUser } = require('../middleware/permission');

// GET /api/dashboard/summary
router.get('/summary', auth, async (req, res) => {
    try {
        // If normal user -> return personal view
        if (req.user.role === 'user') {
            const userId = req.user.id;
            const allowedSpaces = await Permission.countDocuments({ user: userId, revoked: false, canEnter: true, $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] });

            const today = new Date(); today.setHours(0, 0, 0, 0);
            const todaysEntries = await AccessLog.countDocuments({ user: userId, entryTime: { $gte: today } });

            const openLog = await AccessLog.findOne({ user: userId, exitTime: null }).populate('space', 'spaceName');
            const lastLog = await AccessLog.findOne({ user: userId }).sort({ entryTime: -1 }).populate('space', 'spaceName');

            const recentLogs = await AccessLog.find({ user: userId }).sort({ entryTime: -1 }).limit(10).populate('space', 'spaceName');

            return res.json({
                role: 'user',
                allowedSpaces,
                todaysEntries,
                currentlyInside: openLog ? openLog.space.spaceName : null,
                lastActivity: lastLog ? lastLog.entryTime : null,
                recentLogs
            });
        }

        // Admin/manager - global view
        const [usersCount, floorsCount, spacesCount] = await Promise.all([
            User.countDocuments(),
            Floor.countDocuments(),
            Space.countDocuments()
        ]);

        const currentOpen = await AccessLog.find({ exitTime: null }).limit(200).populate('user', 'name email').populate('space', 'spaceName floor').lean();
        const recentLogs = await AccessLog.find({}).sort({ entryTime: -1 }).limit(10).populate('user', 'name').populate('space', 'spaceName').lean();

        const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const busiest = await AccessLog.aggregate([
            { $match: { entryTime: { $gte: since } } },
            { $group: { _id: '$space', visits: { $sum: 1 } } },
            { $sort: { visits: -1 } },
            { $limit: 6 },
            { $lookup: { from: 'spaces', localField: '_id', foreignField: '_id', as: 'space' } },
            { $unwind: { path: '$space', preserveNullAndEmptyArrays: true } },
            { $project: { visits: 1, spaceName: '$space.spaceName', spaceId: '$space._id' } }
        ]);

        const occPerFloor = await AccessLog.aggregate([
            { $match: { exitTime: null } },
            { $lookup: { from: 'spaces', localField: 'space', foreignField: '_id', as: 'space' } },
            { $unwind: '$space' },
            { $group: { _id: '$space.floor', count: { $sum: 1 } } },
            { $lookup: { from: 'floors', localField: '_id', foreignField: '_id', as: 'floor' } },
            { $unwind: { path: '$floor', preserveNullAndEmptyArrays: true } },
            { $project: { floorId: '$floor._id', floornumber: '$floor.floornumber', count: 1 } }
        ]);

        res.json({
            role: 'admin',
            counts: { users: usersCount, floors: floorsCount, spaces: spacesCount },
            currentOpen,
            recentLogs,
            busiest,
            occPerFloor
        });
    } catch (err) {
        console.error('Dashboard summary error', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
