const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function checkRaw() {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;

    // Check raw restaurants collection
    const restaurants = await db.collection('restaurants').find({}).toArray();
    console.log(`\n=== RESTAURANTS (${restaurants.length}) ===`);
    restaurants.forEach(r => {
        console.log(`  - ${r.restaurantName || r.name} | ID: ${r._id}`);
    });

    // Check raw products collection - ALL 43
    const products = await db.collection('products').find({}).toArray();
    console.log(`\n=== PRODUCTS (${products.length}) ===`);
    products.forEach(p => {
        console.log(`  - ${p.name} | ₹${p.price} | RestaurantID: ${p.restaurant}`);
    });

    // Check fooditems
    const fooditems = await db.collection('fooditems').find({}).toArray();
    console.log(`\n=== FOODITEMS (${fooditems.length}) ===`);
    fooditems.forEach(f => {
        console.log(`  - ${f.name} | ₹${f.price}`);
    });

    // Check groceries
    const groceries = await db.collection('groceries').find({}).toArray();
    console.log(`\n=== GROCERIES (${groceries.length}) ===`);
    groceries.forEach(g => {
        console.log(`  - ${g.name || g.storeName} | ID: ${g._id}`);
    });

    // Check groceryproducts
    const gp = await db.collection('groceryproducts').find({}).toArray();
    console.log(`\n=== GROCERYPRODUCTS (${gp.length}) ===`);
    gp.slice(0, 10).forEach(p => {
        console.log(`  - ${p.name} | ₹${p.price}`);
    });
    if (gp.length > 10) console.log(`  ... and ${gp.length - 10} more`);

    await mongoose.disconnect();
    console.log('\nDone.');
}

checkRaw().catch(console.error);
