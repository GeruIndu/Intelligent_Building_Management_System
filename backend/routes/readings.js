const express = require('express');
const router = express.Router();
const Reading = require('../models/Reading');
const Device = require('../models/Device');

// ingest reading (devices or sensors post here)
router.post('/', async (req, res) => {
    try {
        const { deviceId, metrics, timestamp } = req.body;
        const device = await Device.findById(deviceId);
        if (!device) return res.status(404).json({ error: 'Device not found' });

        const r = new Reading({ device: device._id, metrics, timestamp });
        await r.save();

        // simple alert rule: temperature > 40 -> create alert (example)
        if (metrics.temperature && metrics.temperature > 40) {
            // create alert (left as exercise)
        }
        res.json(r);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// query readings
router.get('/', async (req, res) => {
    const { deviceId, from, to } = req.query;
    const q = {};
    if (deviceId) q.device = deviceId;
    if (from || to) q.timestamp = {};
    if (from) q.timestamp.$gte = new Date(from);
    if (to) q.timestamp.$lte = new Date(to);
    const readings = await Reading.find(q).sort({ timestamp: -1 }).limit(100);
    res.json(readings);
});

module.exports = router;
