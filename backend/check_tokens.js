const mongoose = require('mongoose');
const Driver = require('./models/Driver');
require('dotenv').config();

async function checkTokens() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/swiggyclone');
    const ids = ['69799593517055a3fbbf5763', '6978ae557a30eb956d638e5a', '6992b53a4b627a8cd36d74e3'];

    for (const id of ids) {
        const d = await Driver.findById(id);
        if (d) {
            console.log(`Driver: ${d.name} (${d._id})`);
            console.log(`  PushToken: ${d.pushToken}`);
            console.log('---');
        }
    }
    await mongoose.disconnect();
}

checkTokens();
