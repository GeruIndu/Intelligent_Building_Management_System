// routes/spaces.js
const express = require('express');
const router = express.Router();
const Space = require('../models/Space');
const Floor = require('../models/Floor');
const { auth, permit } = require('../middleware/auth');

/**
 * GET /api/spaces
 * Optional query: ?floor=<floorId> or ?type=office
 */
router.get('/', auth, async (req, res) => {
    try {
        const { floor, type } = req.query;
        const q = {};
        if (floor) q.floor = floor;
        if (type) q.spaceType = type;
        const spaces = await Space.find(q).populate('floor', 'floornumber description').sort({ spaceName: 1 });
        res.json(spaces);
    } catch (err) {
        console.error('Get spaces error', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * GET /api/spaces/:id
 */
router.get('/:id', auth, async (req, res) => {
    try {
        const space = await Space.findById(req.params.id).populate('floor', 'floornumber description');
        if (!space) return res.status(404).json({ error: 'Space not found' });
        res.json(space);
    } catch (err) {
        console.error('Get space error', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * POST /api/spaces
 * Admin/manager
 * Body: { spaceName, spaceType, floor }
 */
router.post('/', auth, permit('admin', 'manager'), async (req, res) => {
    try {
        const { spaceName, spaceType, floor } = req.body;
        if (!spaceName || !floor) return res.status(400).json({ error: 'spaceName and floor required' });

        // verify floor exists
        const fl = await Floor.findById(floor);
        if (!fl) return res.status(400).json({ error: 'Invalid floor id' });

        const space = new Space({ spaceName, spaceType, floor });
        await space.save();
        const populated = await space.populate('floor', 'floornumber description');
        res.status(201).json(populated);
    } catch (err) {
        console.error('Create space error', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * PUT /api/spaces/:id
 * Admin/manager
 */
router.put('/:id', auth, permit('admin', 'manager'), async (req, res) => {
    try {
        const { spaceName, spaceType, floor } = req.body;
        if (floor) {
            const fl = await Floor.findById(floor);
            if (!fl) return res.status(400).json({ error: 'Invalid floor id' });
        }
        const updated = await Space.findByIdAndUpdate(req.params.id, { spaceName, spaceType, floor }, { new: true, runValidators: true })
            .populate('floor', 'floornumber description');
        if (!updated) return res.status(404).json({ error: 'Space not found' });
        res.json(updated);
    } catch (err) {
        console.error('Update space error', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * DELETE /api/spaces/:id
 * Admin only
 */
router.delete('/:id', auth, permit('admin'), async (req, res) => {
    try {
        await Space.findByIdAndDelete(req.params.id);
        res.json({ message: 'Space deleted' });
    } catch (err) {
        console.error('Delete space error', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
