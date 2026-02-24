const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const checkOld = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("DB Connected");

        const db = mongoose.connection.db;

        // Check 'fooditems' collection
        const oldItems = await db.collection('fooditems').find({}).toArray();
        console.log(`Items in 'fooditems' collection: ${oldItems.length}`);

        if (oldItems.length > 0) {
            console.log("Found old items:");
            oldItems.forEach(item => {
                console.log(` - ${item.name} (${item.price}) [RestID: ${item.restaurantId}]`);
            });
        } else {
            console.log("No items found in 'fooditems'.");
        }

        // Check 'products' collection for Samosa
        const currentProducts = await db.collection('products').find({ name: { $regex: /samosa/i } }).toArray();
        console.log(`Items in 'products' matching 'Samosa': ${currentProducts.length}`);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkOld();
