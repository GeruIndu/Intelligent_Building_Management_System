// routes/accessLogs.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const AccessLog = require('../models/AccessLog');
const User = require('../models/User');
const Space = require('../models/Space');
const Floor = require('../models/Floor');
const { auth, permit } = require('../middleware/auth');
const { checkUserCanEnter } = require('../middleware/permission');

router.post('/', auth, async (req, res) => {
    try {
        const { user: bodyUser, space, entryTime, notes } = req.body;
        if (!space) return res.status(400).json({ error: 'space is required' });

        // validate space
        const s = await Space.findById(space).populate('floor');
        if (!s) return res.status(400).json({ error: 'Invalid space' });

        // determine user to create log for
        let logUser;
        if (['admin', 'manager'].includes(req.user.role) && bodyUser) {
            // admin explicitly creating for other user
            if (!mongoose.Types.ObjectId.isValid(bodyUser)) return res.status(400).json({ error: 'Invalid user id' });
            const u = await User.findById(bodyUser);
            if (!u) return res.status(400).json({ error: 'Invalid user id' });
            logUser = bodyUser;
        } else {
            // force normal user to create only for themselves
            logUser = req.user.id;
        }

        // permission check for non-admins (admins/managers bypass)
        if (!['admin', 'manager'].includes(req.user.role)) {
            const allowed = await checkUserCanEnter(logUser, space);
            if (!allowed) return res.status(403).json({ error: 'Access denied for this space' });
        }

        // Optionally close any previous open log for same user+space to avoid duplicates
        await AccessLog.findOneAndUpdate({ user: logUser, space, exitTime: null }, { $set: { exitTime: new Date() } });

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

        const populated = await AccessLog.findById(saved._id)
            .populate('user', 'name email contact')
            .populate('space', 'spaceName spaceType floor')
            .populate('floor', 'floornumber');

        res.status(201).json(populated);
    } catch (err) {
        console.error('Create accessLog error', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/** Close (Mark Exit) */
router.post('/close', auth, async (req, res) => {
    try {
        const { user: bodyUser, space, exitTime } = req.body;
        if (!space) return res.status(400).json({ error: 'space is required' });

        let logUser;
        if (['admin', 'manager'].includes(req.user.role) && bodyUser) logUser = bodyUser;
        else logUser = req.user.id;

        const now = exitTime ? new Date(exitTime) : new Date();
        const updated = await AccessLog.findOneAndUpdate(
            { user: logUser, space, exitTime: null },
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

/** Heartbeat */
router.post('/heartbeat', auth, async (req, res) => {
    try {
        const { user: bodyUser, space, timestamp } = req.body;
        if (!space) return res.status(400).json({ error: 'space is required' });

        let logUser = (['admin', 'manager'].includes(req.user.role) && bodyUser) ? bodyUser : req.user.id;
        const now = timestamp ? new Date(timestamp) : new Date();

        const updated = await AccessLog.findOneAndUpdate(
            { user: logUser, space, exitTime: null },
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

/** GET list (with safe query + role restrictions) */
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

        if (!['admin', 'manager'].includes(req.user.role)) {
            q.user = req.user.id;
        }

        const logs = await AccessLog.find(q)
            .sort({ entryTime: -1 })
            .limit(Number(limit))
            .populate('user', 'name email contact')
            .populate('space', 'spaceName spaceType floor')
            .populate('floor', 'floornumber');

        res.json(logs);
    } catch (err) {
        console.error('Query accessLogs error', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/** GET single */
router.get('/:id', auth, async (req, res) => {
    try {
        const log = await AccessLog.findById(req.params.id)
            .populate('user', 'name email contact')
            .populate('space', 'spaceName spaceType floor')
            .populate('floor', 'floornumber');

        if (!log) return res.status(404).json({ error: 'Log not found' });
        if (String(log.user._id) !== req.user.id && !['admin', 'manager'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        res.json(log);
    } catch (err) {
        console.error('Get accessLog error', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/** Update (exitTime, notes) */
router.put('/:id', auth, async (req, res) => {
    try {
        const log = await AccessLog.findById(req.params.id);
        if (!log) return res.status(404).json({ error: 'Log not found' });

        if (String(log.user) !== req.user.id && !['admin', 'manager'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const { exitTime, accessGrant, notes } = req.body;
        if (exitTime !== undefined) log.exitTime = exitTime ? new Date(exitTime) : undefined;
        if (accessGrant !== undefined) log.accessGrant = !!accessGrant;
        if (notes !== undefined) log.notes = notes;
        await log.save();

        const populated = await AccessLog.findById(log._id)
            .populate('user', 'name email contact')
            .populate('space', 'spaceName spaceType floor')
            .populate('floor', 'floornumber');

        res.json(populated);
    } catch (err) {
        console.error('Update accessLog error', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/** Delete - admin only */
router.delete('/:id', auth, permit('admin'), async (req, res) => {
    try {
        const deleted = await AccessLog.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: 'Log not found' });
        res.json({ message: 'Access log deleted' });
    } catch (err) {
        console.error('Delete accessLog error', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
