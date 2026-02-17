const mongoose = require('mongoose');
const Driver = require('./models/Driver');
require('dotenv').config();

async function cleanup() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/swiggyclone');

    // The current active driver ID found in logs
    const activeDriverId = '6992b53a4b627a8cd36d74e3';

    // 1. Force all OTHER online drivers offline
    const result = await Driver.updateMany(
        { _id: { $ne: activeDriverId }, isOnline: true },
        { $set: { isOnline: false, pushToken: null } }
    );

    console.log(`Cleaned up ${result.modifiedCount} stale drivers.`);

    // 2. Ensure active driver has correct city if we want to be helpful
    await Driver.findByIdAndUpdate(activeDriverId, { city: 'Ahmedabad' });
    console.log(`Ensured driver ${activeDriverId} is in Ahmedabad for the test.`);

    await mongoose.disconnect();
}

cleanup();
