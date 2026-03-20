const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function checkRaw() {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;

    // Check raw restaurants collection
    const restaurants = await db.collection('restaurants').find({}).toArray();
    
    restaurants.forEach(r => {
        
    });

    // Check raw products collection - ALL 43
    const products = await db.collection('products').find({}).toArray();
    
    products.forEach(p => {
        
    });

    // Check fooditems
    const fooditems = await db.collection('fooditems').find({}).toArray();
    
    fooditems.forEach(f => {
        
    });

    // Check groceries
    const groceries = await db.collection('groceries').find({}).toArray();
    
    groceries.forEach(g => {
        
    });

    // Check groceryproducts
    const gp = await db.collection('groceryproducts').find({}).toArray();
    
    gp.slice(0, 10).forEach(p => {
        
    });
    if (gp.length > 10) 

    await mongoose.disconnect();
    
}

checkRaw().catch(console.error);
