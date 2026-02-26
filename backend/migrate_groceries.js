require('dotenv').config();
const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');
const Grocery = require('./models/Grocery');
const Product = require('./models/Product');
const Order = require('./models/Order');

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Find all Groceries in the Restaurant collection
        // Note: I temporarily removed GROCERY from the enum in Restaurant.js, 
        // but existing data still has it. Mongoose might complain if I use the model, 
        // so I'll use the raw collection if needed, or just trust it.
        const groceries = await Restaurant.find({ storeType: 'GROCERY' });
        console.log(`Found ${groceries.length} groceries to migrate.`);

        for (const g of groceries) {
            console.log(`Migrating: ${g.name}...`);

            // Create in new Grocery collection
            const groceryData = g.toObject();
            delete groceryData._id; // Let it generate a new ID to avoid conflict?
            // Actually, keep the ID so references don't break if I update them!
            // But if I keep ID, I must delete from Restaurant first or use a different collection name.
            // Best approach: Insert with same ID into Groceries, then delete from Restaurants.

            const newGrocery = new Grocery(g.toObject());
            await newGrocery.save();
            console.log(`  Inserted into groceries collection.`);

            // 2. Update Products
            const productUpdate = await Product.updateMany(
                { restaurant: g._id },
                {
                    $set: {
                        merchantType: 'Grocery'
                    }
                }
            );
            console.log(`  Updated ${productUpdate.modifiedCount} products.`);

            // 3. Update Orders
            const orderUpdate = await Order.updateMany(
                { restaurant: g._id },
                {
                    $set: {
                        merchantType: 'Grocery'
                    }
                }
            );
            console.log(`  Updated ${orderUpdate.modifiedCount} orders.`);

            // 4. Remove from Restaurant collection
            await Restaurant.deleteOne({ _id: g._id });
            console.log(`  Removed from restaurants collection.`);
        }

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
