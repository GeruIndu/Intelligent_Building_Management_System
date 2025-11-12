// connect mongoose, create a few devices and sample readings
const mongoose = require('mongoose');
const Device = require('../models/Device');
const Reading = require('../models/Reading');
require('dotenv').config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    await Device.deleteMany({});
    const d1 = await Device.create({ name: 'TempSensor-Lobby', type: 'temperature', location: { zone: 'lobby', room: '' } });
    await Reading.create([
        { device: d1._id, metrics: { temperature: 22.3, humidity: 45 } },
        { device: d1._id, metrics: { temperature: 23.1, humidity: 44 } }
    ]);
    console.log('seeded');
    process.exit();
}
run();
