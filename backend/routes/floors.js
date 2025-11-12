// routes/floors.js
const express = require('express');
const router = express.Router();
const Floor = require('../models/Floor');
const { auth, permit } = require('../middleware/auth');
const { findActivePermissionsForUser } = require('../middleware/permission');

router.get('/', auth, async (req, res) => {
    try {
        if (['admin', 'manager'].includes(req.user.role)) {
            const floors = await Floor.find().sort({ floornumber: 1 });
            return res.json(floors);
        }

        const perms = await findActivePermissionsForUser(req.user.id);
        const allowedFloorIds = perms.map(p => p.space && p.space.floor).filter(Boolean).map(String);
        if (!allowedFloorIds.length) return res.json([]);

        const floors = await Floor.find({ _id: { $in: allowedFloorIds } }).sort({ floornumber: 1 });
        return res.json(floors);
    } catch (err) {
        console.error('Get floors error', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
