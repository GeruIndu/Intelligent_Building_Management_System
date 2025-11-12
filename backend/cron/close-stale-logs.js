// cron/close-stale-logs.js
const cron = require('node-cron');
const AccessLog = require('../models/AccessLog');

function startCloseStaleLogs({ intervalSchedule = '*/2 * * * *', idleSeconds = 600 } = {}) {

    cron.schedule(intervalSchedule, async () => {
        try {
            const cutoff = new Date(Date.now() - idleSeconds * 1000);
            const stale = await AccessLog.find({ exitTime: null, lastSeen: { $lt: cutoff } }).limit(500);
            for (const log of stale) {
                log.exitTime = new Date(log.lastSeen.getTime() + 1000); // close right after lastSeen
                await log.save();
            }
        } catch (err) {
            console.error('[cron] close stale logs error', err);
        }
    });
}

module.exports = { startCloseStaleLogs };
