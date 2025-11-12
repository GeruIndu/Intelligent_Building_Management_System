// routes/accessLogs.js
const express = require('express');
const router = express.Router();
const AccessLog = require('../models/AccessLog');
const User = require('../models/User');
const Space = require('../models/Space');
const Floor = require('../models/Floor');
const { auth, permit } = require('../middleware/auth');

/**
 * POST /api/access-logs
 * Create an access log entry when a user enters or exits
 * Body: { user: userId, space: spaceId, entryTime?, exitTime?, accessGrant?, notes? }
 */
router.post('/', auth, async (req, res) => {
    try {
        const { user, space, entryTime, exitTime, accessGrant, notes } = req.body;
        if (!user || !space) return res.status(400).json({ error: 'user and space are required' });

        const u = await User.findById(user);
        const s = await Space.findById(space).populate('floor');
        if (!u || !s) return res.status(400).json({ error: 'Invalid user or space' });

        const log = new AccessLog({
            user,
            space,
            floor: s.floor ? s.floor._id : null,
            entryTime: entryTime ? new Date(entryTime) : new Date(),
            exitTime: exitTime ? new Date(exitTime) : undefined,
            accessGrant: accessGrant !== undefined ? !!accessGrant : true,
            notes
        });
        await log.save();
        const populated = await AccessLog.findById(log._id)
            .populate('user', 'name email')
            .populate('space', 'spaceName spaceType')
            .populate('floor', 'floornumber');
        // const populated = await log.populate('user', 'name email').populate('space', 'spaceName spaceType').populate('floor', 'floornumber');
        res.status(201).json(populated);
    } catch (err) {
        console.error('Create accessLog error', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * GET /api/access-logs
 * Query by user, space, floor, date range:
 * ?user=<id>&space=<id>&floor=<id>&from=2025-01-01&to=2025-01-31&limit=50
 */
router.get('/', auth, async (req, res) => {
    try {
        const { user, space, floor, from, to, limit = 100 } = req.query;
        const q = {};
        if (user) q.user = user;
        if (space) q.space = space;
        if (floor) q.floor = floor;
        if (from || to) q.entryTime = {};
        if (from) q.entryTime.$gte = new Date(from);
        if (to) q.entryTime.$lte = new Date(to);

        const logs = await AccessLog.find(q)
            .sort({ entryTime: -1 })
            .limit(Number(limit))
            .populate('user', 'name email contact')
            .populate('space', 'spaceName spaceType')
            .populate('floor', 'floornumber');
        res.json(logs);
    } catch (err) {
        console.error('Query accessLogs error', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * GET /api/access-logs/:id
 */
router.get('/:id', auth, async (req, res) => {
    try {
        const log = await AccessLog.findById(req.params.id)
            .populate('user', 'name email')
            .populate('space', 'spaceName spaceType')
            .populate('floor', 'floornumber');
        if (!log) return res.status(404).json({ error: 'Log not found' });
        res.json(log);
    } catch (err) {
        console.error('Get accessLog error', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * PUT /api/access-logs/:id
 * Update exit time or notes (manager/admin or owning user)
 */
router.put('/:id', auth, async (req, res) => {
    try {
        const log = await AccessLog.findById(req.params.id);
        if (!log) return res.status(404).json({ error: 'Log not found' });

        // allow owner or manager/admin to update
        if (String(log.user) !== req.user.id && !['admin', 'manager'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const { exitTime, accessGrant, notes } = req.body;
        if (exitTime) log.exitTime = new Date(exitTime);
        if (accessGrant !== undefined) log.accessGrant = !!accessGrant;
        if (notes !== undefined) log.notes = notes;
        await log.save();
        const populated = await log.populate('user', 'name email').populate('space', 'spaceName').populate('floor', 'floornumber');
        res.json(populated);
    } catch (err) {
        console.error('Update accessLog error', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * DELETE /api/access-logs/:id
 * Admin only (or you can allow manager)
 */
router.delete('/:id', auth, permit('admin'), async (req, res) => {
    try {
        await AccessLog.findByIdAndDelete(req.params.id);
        res.json({ message: 'Access log deleted' });
    } catch (err) {
        console.error('Delete accessLog error', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
