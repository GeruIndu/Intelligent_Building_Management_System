// routes/permissions.js
const express = require('express');
const router = express.Router();
const Permission = require('../models/Permission');
const User = require('../models/User');
const Space = require('../models/Space');
const { auth, permit } = require('../middleware/auth');

// Create or update (upsert) permission - admin/manager only
router.post('/', auth, permit('admin', 'manager'), async (req, res) => {
    try {
        const { user, space, canEnter = true, canManage = false, expiresAt } = req.body;
        if (!user || !space) return res.status(400).json({ error: 'user and space are required' });
        const u = await User.findById(user);
        const s = await Space.findById(space);
        if (!u || !s) return res.status(400).json({ error: 'Invalid user or space' });

        const update = {
            user, space, canEnter, canManage, createdBy: req.user.id,
            revoked: false,
            expiresAt: expiresAt ? new Date(expiresAt) : null
        };

        const perm = await Permission.findOneAndUpdate(
            { user, space },
            update,
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.status(201).json(perm);
    } catch (err) {
        console.error('Create permission error', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// List (admin/manager). For user, we could expose GET /api/permissions?user=me via client calling their own id.
router.get('/', auth, permit('admin', 'manager'), async (req, res) => {
    try {
        const { user, space, active } = req.query;
        const q = {};
        if (user) q.user = user;
        if (space) q.space = space;
        if (active === 'true') q.revoked = false;
        const perms = await Permission.find(q).populate('user', 'name email').populate('space', 'spaceName spaceType').sort({ createdAt: -1 });
        res.json(perms);
    } catch (err) {
        console.error('List permissions error', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get one
router.get('/:id', auth, permit('admin', 'manager'), async (req, res) => {
    try {
        const perm = await Permission.findById(req.params.id).populate('user', 'name email').populate('space', 'spaceName');
        if (!perm) return res.status(404).json({ error: 'Permission not found' });
        res.json(perm);
    } catch (err) {
        console.error('Get permission error', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update (admin/manager)
router.put('/:id', auth, permit('admin', 'manager'), async (req, res) => {
    try {
        const { canEnter, canManage, revoked, expiresAt } = req.body;
        const perm = await Permission.findById(req.params.id);
        if (!perm) return res.status(404).json({ error: 'Permission not found' });
        if (canEnter !== undefined) perm.canEnter = !!canEnter;
        if (canManage !== undefined) perm.canManage = !!canManage;
        if (revoked !== undefined) {
            perm.revoked = !!revoked;
            perm.revokedAt = revoked ? new Date() : null;
        }
        if (expiresAt !== undefined) perm.expiresAt = expiresAt ? new Date(expiresAt) : null;
        await perm.save();
        const populated = await Permission.findById(perm._id).populate('user', 'name email').populate('space', 'spaceName');
        res.json(populated);
    } catch (err) {
        console.error('Update permission error', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete (admin)
router.delete('/:id', auth, permit('admin'), async (req, res) => {
    try {
        const deleted = await Permission.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: 'Permission not found' });
        res.json({ message: 'Permission deleted' });
    } catch (err) {
        console.error('Delete permission error', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
