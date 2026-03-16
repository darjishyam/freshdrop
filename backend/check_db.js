const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function checkDB() {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;

    // Check restaurants
    const restaurants = await db.collection('restaurants').find({}).toArray();
    console.log(`\n=== RESTAURANTS (${restaurants.length}) ===`);
    restaurants.forEach(r => {
        console.log(`  - ${r.restaurantName || r.name} | Owner: ${r.ownerName} | Status: ${r.status} | ID: ${r._id}`);
    });

    // Check products
    const products = await db.collection('products').find({}).toArray();
    console.log(`\n=== PRODUCTS (${products.length}) ===`);
    products.forEach(p => {
        console.log(`  - ${p.name} | ₹${p.price} | Restaurant: ${p.restaurant}`);
    });

    // Check users
    const users = await db.collection('users').find({}).toArray();
    console.log(`\n=== USERS (${users.length}) ===`);
    users.forEach(u => {
        console.log(`  - ${u.name} | ${u.email} | Phone: ${u.phone}`);
    });

    await mongoose.disconnect();
    console.log('\nDone.');
}

checkDB().catch(console.error);
