const mongoose = require('mongoose');
const Driver = require('./models/Driver');
require('dotenv').config();

async function checkOnlineDrivers() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/swiggyclone');
    const onlineDrivers = await Driver.find({ isOnline: true });

    console.log(`Found ${onlineDrivers.length} online drivers:`);
    for (const d of onlineDrivers) {
        console.log(`Driver: ${d.name} (${d._id})`);
        console.log(`  City: ${d.city}`);
        console.log(`  Loc: ${JSON.stringify(d.location.coordinates)}`);
        console.log(`  Token: ${d.pushToken}`);
        console.log('---');
    }
    await mongoose.disconnect();
}

checkOnlineDrivers();
