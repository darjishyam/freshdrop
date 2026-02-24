const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');

const MONGO_URI = "mongodb+srv://professor:CQ33cuFBo1SoplWf@cluster0.9zk2jrk.mongodb.net/freshdrop?retryWrites=true&w=majority";

console.log("Connecting...");

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log("✅ Connected");
        try {
            const allRestaurants = await Restaurant.find({}, 'name externalId');
            console.log("\n--- CANDIDATES FOR DELETION/KEEPING ---");
            allRestaurants.forEach(r => {
                console.log(`"${r.name}" (ID: ${r._id}, ExtID: ${r.externalId})`);
            });
        } catch (e) {
            console.error(e);
        } finally {
            mongoose.connection.close();
        }
    })
    .catch(err => console.error(err));
