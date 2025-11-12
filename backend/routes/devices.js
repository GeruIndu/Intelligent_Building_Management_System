// routes/devices.js
const express = require('express');
const router = express.Router();
const Device = require('../models/Device');

/**
 * @route   GET /api/devices
 * @desc    Get all devices
 * @access  Public (You can later protect with JWT middleware)
 */
router.get('/', async (req, res) => {
    try {
        const devices = await Device.find().sort({ createdAt: -1 });
        res.status(200).json(devices);
    } catch (error) {
        console.error('Error fetching devices:', error.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

/**
 * @route   GET /api/devices/:id
 * @desc    Get a specific device by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
    try {
        const device = await Device.findById(req.params.id);
        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }
        res.status(200).json(device);
    } catch (error) {
        console.error('Error fetching device:', error.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

/**
 * @route   POST /api/devices
 * @desc    Add a new device
 * @access  Public (later: only Admin/Manager)
 */
router.post('/', async (req, res) => {
    try {
        const { name, type, location, status, meta } = req.body;

        if (!name || !type) {
            return res.status(400).json({ error: 'Device name and type are required' });
        }

        const newDevice = new Device({
            name,
            type,
            location: location || {},
            status: status || 'active',
            meta: meta || {}
        });

        const savedDevice = await newDevice.save();
        res.status(201).json(savedDevice);
    } catch (error) {
        console.error('Error adding device:', error.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

/**
 * @route   PUT /api/devices/:id
 * @desc    Update an existing device
 * @access  Public (later: only Admin/Manager)
 */
router.put('/:id', async (req, res) => {
    try {
        const { name, type, location, status, meta } = req.body;
        const updated = await Device.findByIdAndUpdate(
            req.params.id,
            { name, type, location, status, meta },
            { new: true, runValidators: true }
        );
        if (!updated) {
            return res.status(404).json({ error: 'Device not found' });
        }
        res.status(200).json(updated);
    } catch (error) {
        console.error('Error updating device:', error.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

/**
 * @route   DELETE /api/devices/:id
 * @desc    Delete a device
 * @access  Public (later: only Admin)
 */
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await Device.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: 'Device not found' });
        }
        res.status(200).json({ message: 'Device deleted successfully' });
    } catch (error) {
        console.error('Error deleting device:', error.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

module.exports = router;
