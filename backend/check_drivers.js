const mongoose = require('mongoose');
const Driver = require('./models/Driver');
require('dotenv').config();

async function checkDrivers() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/swiggyclone');
    const ids = ['6992b53a4b627a8cd36d74e3', '69799593517055a3fbbf5763', '6978ae557a30eb956d638e5a'];

    for (const id of ids) {
        const d = await Driver.findById(id);
        if (d) {
            console.log(`Driver: ${d.name} (${d._id})`);
            console.log(`  City: ${d.city}`);
            console.log(`  Location: ${JSON.stringify(d.location)}`);
            console.log(`  IsOnline: ${d.isOnline}`);
            console.log(`  Status: ${d.status}`);
            console.log('---');
        } else {
            console.log(`Driver ${id} not found`);
        }
    }
    await mongoose.disconnect();
}

checkDrivers();
