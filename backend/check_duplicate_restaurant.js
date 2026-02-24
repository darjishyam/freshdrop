const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');
const dotenv = require('dotenv');

dotenv.config();

const checkDuplicate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // This is the ID from the URL in screenshot 1097
        // (Assuming I can read it: 69958b8f5e18b0c6db901f32)
        // Wait, let me double check the screenshot URL.
        // URL: http://localhost:8082/restaurant/69959239b10fd2a60df30dc8
        const duplicateId = '69959239b10fd2a60df30dc8';

        console.log(`Checking ID from screenshot: ${duplicateId}`);

        const dup = await Restaurant.findById(duplicateId);

        if (dup) {
            console.log("FOUND DUPLICATE RESTAURANT:");
            console.log(`Name: ${dup.name}`);
            console.log(`ID: ${dup._id}`);
            console.log(`Email: ${dup.email}`);
            console.log(`External ID: ${dup.externalId}`);
            console.log(`Is this the REAL one? (Real ID is 6995785a46141973cc864bf9)`);
        } else {
            console.log("ID NOT FOUND in DB. Maybe it's a mock ID?");
        }

        const real = await Restaurant.findById('6995785a46141973cc864bf9');
        if (real) {
            console.log("\nREAL RESTAURANT for comparison:");
            console.log(`Name: ${real.name}`);
            console.log(`ID: ${real._id}`);
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkDuplicate();
