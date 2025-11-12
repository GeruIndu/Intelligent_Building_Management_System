// routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth, permit } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

/**
 * GET /api/users
 * Admin/manager only: list users
 */
router.get('/', auth, permit('admin', 'manager'), async (req, res) => {
    try {
        const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        console.error('Fetch users error', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * GET /api/users/me
 * Authenticated user: get own profile
 */
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-passwordHash');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        console.error('Get profile error', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * GET /api/users/:id
 * Admin/manager or self
 */
router.get('/:id', auth, async (req, res) => {
    try {
        const targetId = req.params.id;
        if (req.user.id !== targetId && !['admin', 'manager'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const user = await User.findById(targetId).select('-passwordHash');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        console.error('Get user error', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * PUT /api/users/:id
 * Update user (admin/manager or self). To change password send `password`.
 */
router.put('/:id', auth, async (req, res) => {
    try {
        const targetId = req.params.id;
        if (req.user.id !== targetId && !['admin', 'manager'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const { name, contact, role, password } = req.body;
        const update = { name, contact };
        if (role && req.user.role === 'admin') update.role = role; // only admin can change roles
        if (password) {
            const salt = await bcrypt.genSalt(10);
            update.passwordHash = await bcrypt.hash(password, salt);
        }

        const updated = await User.findByIdAndUpdate(targetId, update, { new: true }).select('-passwordHash');
        if (!updated) return res.status(404).json({ error: 'User not found' });
        res.json(updated);
    } catch (err) {
        console.error('Update user error', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * DELETE /api/users/:id
 * Admin only
 */
router.delete('/:id', auth, permit('admin'), async (req, res) => {
    try {
        const deleted = await User.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User deleted' });
    } catch (err) {
        console.error('Delete user error', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
