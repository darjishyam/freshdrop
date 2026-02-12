const mongoose = require("mongoose");
const Driver = require("./models/Driver");
require("dotenv").config();

const forceOnline = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ DB Connected");

        const result = await Driver.updateMany({}, {
            $set: {
                isOnline: true,
                status: "ACTIVE"
            }
        });

        console.log(`✅ Updated ${result.modifiedCount} drivers to ONLINE & ACTIVE`);

        const drivers = await Driver.find({});
        drivers.forEach(d => {
            console.log(`Driver: ${d.name} (${d.phone}) -> Online: ${d.isOnline}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.connection.close();
    }
};

forceOnline();
