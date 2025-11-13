// routes/accessLogs.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const AccessLog = require('../models/AccessLog');
const Space = require('../models/Space');
const { auth } = require('../middleware/auth');
const { checkUserCanEnter } = require('../middleware/permission');

/**
 * Create entry (Start Entry)
 * - Normal users: can create only for themselves and only for spaces they have active permission for.
 * - Admin/manager: may create on behalf of a user (optional).
 */
router.post('/', auth, async (req, res) => {
    try {
        const { space, user: bodyUser, entryTime, notes } = req.body;
        if (!space) return res.status(400).json({ error: 'space is required' });

        // validate space exists
        const s = await Space.findById(space).populate('floor');
        if (!s) return res.status(400).json({ error: 'Invalid space' });

        // choose user: admins/managers may create for others; normal users only themselves
        const actorRole = req.user.role;
        let logUser;
        if ((actorRole === 'admin' || actorRole === 'manager') && bodyUser) {
            if (!mongoose.Types.ObjectId.isValid(bodyUser)) return res.status(400).json({ error: 'Invalid body user id' });
            logUser = bodyUser;
        } else {
            logUser = req.user.id;
        }

        // Permission check for non-admins: ensure the *target* user has permission for this space
        if (actorRole !== 'admin' && actorRole !== 'manager') {
            const allowed = await checkUserCanEnter(logUser, space);
            if (!allowed) return res.status(403).json({ error: 'You do not have permission to enter this space' });
        }

        // Optional: prevent multiple open logs for same user+space — close previous open one
        await AccessLog.findOneAndUpdate(
            { user: logUser, space, exitTime: null },
            { $set: { exitTime: new Date() } }
        );

        const log = new AccessLog({
            user: logUser,
            space,
            floor: s.floor ? s.floor._id : null,
            entryTime: entryTime ? new Date(entryTime) : new Date(),
            lastSeen: new Date(),
            notes,
            accessGrant: true
        });

        const saved = await log.save();

        // return populated result
        const populated = await AccessLog.findById(saved._id)
            .populate('user', 'name email')
            .populate('space', 'spaceName floor')
            .populate('floor', 'floornumber');

        res.status(201).json(populated);
    } catch (err) {
        console.error('Create accessLog error', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * Close (Mark Exit)
 * - Normal users: can close their own open logs for spaces they have permission for.
 * - Admin/manager: may close logs for anyone.
 */
router.post('/close', auth, async (req, res) => {
    try {
        const { space, user: bodyUser, exitTime } = req.body;
        if (!space) return res.status(400).json({ error: 'space is required' });

        const actorRole = req.user.role;
        const targetUser = (actorRole === 'admin' || actorRole === 'manager') && bodyUser ? bodyUser : req.user.id;

        // Permission check for normal users — they must have permission for the space to close it
        if (actorRole !== 'admin' && actorRole !== 'manager') {
            const allowed = await checkUserCanEnter(targetUser, space);
            if (!allowed) return res.status(403).json({ error: 'You do not have permission to exit this space' });
        }

        // atomic close: find latest open log for that user+space
        const now = exitTime ? new Date(exitTime) : new Date();
        const updated = await AccessLog.findOneAndUpdate(
            { user: targetUser, space, exitTime: null },
            { $set: { exitTime: now } },
            { new: true }
        )
            .populate('user', 'name email')
            .populate('space', 'spaceName')
            .populate('floor', 'floornumber');

        if (!updated) return res.status(404).json({ error: 'No open access log found' });
        return res.json(updated);
    } catch (err) {
        console.error('Close log error', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * Heartbeat - update lastSeen on open log
 * - Normal users: updates their own open log for the space
 * - Admin/manager: may update for any user (optional)
 */
router.post('/heartbeat', auth, async (req, res) => {
    try {
        const { space, user: bodyUser, timestamp } = req.body;
        if (!space) return res.status(400).json({ error: 'space is required' });

        const actorRole = req.user.role;
        const targetUser = (actorRole === 'admin' || actorRole === 'manager') && bodyUser ? bodyUser : req.user.id;

        // Permission check for normal users
        if (actorRole !== 'admin' && actorRole !== 'manager') {
            const allowed = await checkUserCanEnter(targetUser, space);
            if (!allowed) return res.status(403).json({ error: 'You do not have permission for this space' });
        }

        const now = timestamp ? new Date(timestamp) : new Date();
        const updated = await AccessLog.findOneAndUpdate(
            { user: targetUser, space, exitTime: null },
            { $set: { lastSeen: now } },
            { new: true }
        );

        if (!updated) return res.status(404).json({ error: 'No open access log found' });
        return res.json({ ok: true, lastSeen: updated.lastSeen });
    } catch (err) {
        console.error('Heartbeat error', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * GET /api/access-logs
 * - Admin/manager: returns all logs (optional filters)
 * - Normal user: returns *only their* logs
 */
router.get('/', auth, async (req, res) => {
    try {
        const { user, space, floor, from, to, limit = 100 } = req.query;
        const q = {};

        // allow query args only for admins/managers; otherwise restrict to req.user.id
        if (req.user.role === 'admin' || req.user.role === 'manager') {
            if (user) q.user = user;
            if (space) q.space = space;
        } else {
            q.user = req.user.id;
        }
        if (floor) q.floor = floor;
        if (from || to) q.entryTime = {};
        if (from) q.entryTime.$gte = new Date(from);
        if (to) q.entryTime.$lte = new Date(to);

        const logs = await AccessLog.find(q)
            .sort({ entryTime: -1 })
            .limit(Number(limit))
            .populate('user', 'name email')
            .populate('space', 'spaceName floor')
            .populate('floor', 'floornumber');

        res.json(logs);
    } catch (err) {
        console.error('Query accessLogs error', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
