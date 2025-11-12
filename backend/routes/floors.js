// routes/floors.js
const express = require('express');
const router = express.Router();
const Floor = require('../models/Floor');
const { auth, permit } = require('../middleware/auth');

/**
 * GET /api/floors
 * Public or authenticated (you can change)
 */
router.get('/', auth, async (req, res) => {
    try {
        const floors = await Floor.find().sort({ floornumber: 1 });
        res.json(floors);
    } catch (err) {
        console.error('Get floors error', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * GET /api/floors/:id
 */
router.get('/:id', auth, async (req, res) => {
    try {
        const floor = await Floor.findById(req.params.id);
        if (!floor) return res.status(404).json({ error: 'Floor not found' });
        res.json(floor);
    } catch (err) {
        console.error('Get floor error', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * POST /api/floors
 * Admin/manager only
 */
router.post('/', auth, permit('admin', 'manager'), async (req, res) => {
    try {
        const { floornumber, description } = req.body;
        if (!floornumber) return res.status(400).json({ error: 'floornumber required' });
        const floor = new Floor({ floornumber, description });
        await floor.save();
        res.status(201).json(floor);
    } catch (err) {
        console.error('Create floor error', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * PUT /api/floors/:id
 * Admin/manager
 */
router.put('/:id', auth, permit('admin', 'manager'), async (req, res) => {
    try {
        const { floornumber, description } = req.body;
        const updated = await Floor.findByIdAndUpdate(req.params.id, { floornumber, description }, { new: true, runValidators: true });
        if (!updated) return res.status(404).json({ error: 'Floor not found' });
        res.json(updated);
    } catch (err) {
        console.error('Update floor error', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * DELETE /api/floors/:id
 * Admin only
 */
router.delete('/:id', auth, permit('admin'), async (req, res) => {
    try {
        await Floor.findByIdAndDelete(req.params.id);
        // optionally cascade-delete spaces, or set floor to null in spaces
        res.json({ message: 'Floor deleted' });
    } catch (err) {
        console.error('Delete floor error', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
