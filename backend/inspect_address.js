const mongoose = require("mongoose");
const Address = require("./models/Address");
const User = require("./models/User");
require("dotenv").config();

async function inspectAddresses() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const addresses = await Address.find().populate("user", "name email");
        console.log(`Found ${addresses.length} addresses.`);

        addresses.forEach(addr => {
            console.log(`\nUser: ${addr.user ? addr.user.name : 'Unknown'} (${addr.user ? addr.user.email : 'No Email'})`);
            console.log(`Type: ${addr.type} | Default: ${addr.isDefault}`);
            console.log(`Street: "${addr.street}"`);
            console.log(`City: "${addr.city}"`);
            console.log(`Coords: ${JSON.stringify(addr.coordinates)}`);
        });

    } catch (error) {
        console.error("Inspection Error:", error);
    } finally {
        setTimeout(() => { mongoose.disconnect(); process.exit(0); }, 2000);
    }
}

inspectAddresses();
