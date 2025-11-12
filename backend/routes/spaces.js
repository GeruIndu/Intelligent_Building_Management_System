// routes/spaces.js
const express = require('express');
const router = express.Router();
const Space = require('../models/Space');
const Permission = require('../models/Permission');
const { auth, permit } = require('../middleware/auth');
const { findActivePermissionsForUser } = require('../middleware/permission');

router.get('/', auth, async (req, res) => {
    try {
        const userRole = req.user.role;
        if (['admin', 'manager'].includes(userRole)) {
            const spaces = await Space.find().populate('floor', 'floornumber description');
            return res.json(spaces);
        }

        const perms = await findActivePermissionsForUser(req.user.id);
        const allowedSpaceIds = perms.map(p => p.space && p.space._id).filter(Boolean).map(String);
        if (!allowedSpaceIds.length) return res.json([]);

        const spaces = await Space.find({ _id: { $in: allowedSpaceIds } }).populate('floor', 'floornumber description');
        return res.json(spaces);
    } catch (err) {
        console.error('Get spaces error', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
