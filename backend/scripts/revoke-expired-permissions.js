// scripts/revoke-expired-permissions.js
const mongoose = require('mongoose');
require('dotenv').config();
const Permission = require('../models/Permission');

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    const now = new Date();
    const res = await Permission.updateMany({ expiresAt: { $lte: now }, revoked: false }, { $set: { revoked: true, revokedAt: now } });
    console.log('Revoked count:', res.modifiedCount);
    await mongoose.disconnect();
}
run().catch(err => { console.error(err); process.exit(1); });
