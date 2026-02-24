const mongoose = require('mongoose');
const Product = require('./models/Product');
const MONGO_URI = "mongodb+srv://professor:CQ33cuFBo1SoplWf@cluster0.9zk2jrk.mongodb.net/freshdrop?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI).then(async () => {
    console.log("Connected.");

    // 1. Find by Name
    const p = await Product.findOne({ name: 'VadaPav' });
    if (p) {
        console.log("Found VadaPav by Name!");
        console.log("Restaurant Field:", p.restaurant);
        console.log("Type:", typeof p.restaurant);

        // 2. Find by this Restaurant ID
        const restId = p.restaurant;
        const list = await Product.find({ restaurant: restId });
        console.log(`Found ${list.length} items using its own restaurant ID.`);

        // 3. Find by explicit ObjectId
        const list2 = await Product.find({ restaurant: new mongoose.Types.ObjectId(restId.toString()) });
        console.log(`Found ${list2.length} items using new ObjectId.`);

    } else {
        console.log("VadaPav not found by name using Product model.");
        // List all names
        const all = await Product.find({}, 'name');
        console.log("All Product Names:", all.map(x => x.name));
    }

    process.exit();
}).catch(err => { console.error(err); process.exit(); });
