const mongoose = require('mongoose');
const Product = require('./models/Product');
const MONGO_URI = "mongodb+srv://professor:CQ33cuFBo1SoplWf@cluster0.9zk2jrk.mongodb.net/freshdrop?retryWrites=true&w=majority";

const restaurantId = "67b458d929f635c44f86055d"; // Heer Restaurant ID

mongoose.connect(MONGO_URI).then(async () => {
    console.log(`Connecting to: ${MONGO_URI}`);
    console.log(`Querying for Restaurant ID: ${restaurantId}`);

    // Test 1: String ID
    const p1 = await Product.find({ restaurant: restaurantId });
    console.log(`Test 1 (String ID): Found ${p1.length} products`);

    // Test 2: ObjectId
    const p2 = await Product.find({ restaurant: new mongoose.Types.ObjectId(restaurantId) });
    console.log(`Test 2 (ObjectId): Found ${p2.length} products`);

    process.exit();
}).catch(err => console.error(err));
