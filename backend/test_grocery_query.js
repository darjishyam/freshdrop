const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');

const MONGO_URI = "mongodb+srv://professor:CQ33cuFBo1SoplWf@cluster0.9zk2jrk.mongodb.net/freshdrop?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log("Connected to DB");
        const all = await Restaurant.find({ status: 'APPROVED' });
        console.log("Found Approved Stores:", all.length);
        all.forEach(s => {
            console.log(`- ${s.name}: type=${s.storeType}, status=${s.status}`);
        });

        const groceries = await Restaurant.find({ storeType: 'GROCERY', status: 'APPROVED' });
        console.log("\nGrocery search results (using find({storeType: 'GROCERY', status: 'APPROVED'})): ", groceries.length);
        groceries.forEach(s => {
            console.log(`- ${s.name}`);
        });

        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
