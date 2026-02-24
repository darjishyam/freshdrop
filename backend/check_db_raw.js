const mongoose = require('mongoose');
const MONGO_URI = "mongodb+srv://professor:CQ33cuFBo1SoplWf@cluster0.9zk2jrk.mongodb.net/freshdrop?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI).then(async () => {
    console.log("Connected to DB");

    // Access native driver
    const collection = mongoose.connection.db.collection('fooditems');

    // Find first 5 items
    const items = await collection.find({}).limit(5).toArray();

    console.log(`Found ${items.length} raw items`);
    items.forEach(item => {
        console.log("--- RAW ITEM ---");
        console.log("Name:", item.name);
        console.log("Restaurant Field:", item.restaurant);
        console.log("Type of Restaurant Field:", typeof item.restaurant);
        if (item.restaurant) {
            console.log("Constructor Name:", item.restaurant.constructor ? item.restaurant.constructor.name : "N/A");
            // Check if it's a BSON ObjectId
            console.log("Is it Hex String?", /^[0-9a-fA-F]{24}$/.test(item.restaurant.toString()));
        }
    });

    process.exit();
}).catch(err => console.error(err));
