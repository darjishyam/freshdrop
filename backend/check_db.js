const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function checkDB() {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;

    // Check restaurants
    const restaurants = await db.collection('restaurants').find({}).toArray();
    
    restaurants.forEach(r => {
        
    });

    // Check products
    const products = await db.collection('products').find({}).toArray();
    
    products.forEach(p => {
        
    });

    // Check users
    const users = await db.collection('users').find({}).toArray();
    
    users.forEach(u => {
        
    });

    await mongoose.disconnect();
    
}

checkDB().catch(console.error);
