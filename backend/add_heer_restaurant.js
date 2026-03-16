const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');
const Product = require('./models/Product');
require('dotenv').config();

async function addHeerRestaurant() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Check if Heer Restaurant already exists
        const existing = await Restaurant.findOne({ name: 'Heer Restaurant' });
        if (existing) {
            console.log('⚠️ Heer Restaurant already exists! Skipping restaurant creation.');
            console.log(`   ID: ${existing._id}`);
        }

        const restaurant = existing || await Restaurant.create({
            name: 'Heer Restaurant',
            restaurantName: 'Heer Restaurant',
            email: 'shyamdarji1604@gmail.com',
            ownerName: 'Shyam',
            image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=500',
            rating: 4.5,
            ratingCount: 100,
            deliveryTime: '25-35 min',
            priceRange: '₹300 for two',
            cuisines: ['North Indian', 'Fast Food', 'Sweets', 'Street Food'],
            address: {
                street: 'Main Road',
                city: 'Panchot',
                coordinates: { lat: 23.6500, lon: 72.4000 }, // Panchot, Gujarat
            },
            isOpen: true,
            status: 'APPROVED',
        });

        if (!existing) {
            console.log(`✅ Created Heer Restaurant | ID: ${restaurant._id}`);
        }

        // Add products
        const heerProducts = [
            {
                restaurant: restaurant._id,
                name: 'Vadapav',
                image: 'https://images.unsplash.com/photo-1606491956689-2ea866880049?w=300',
                price: 30,
                originalPrice: 40,
                description: 'Crispy batata vada in soft pav with chutneys',
                category: 'Street Food',
                isVeg: true,
                rating: 4.6,
                votes: 120,
                isBestSeller: true,
                inStock: true,
                quantityDetails: [{ quantity: 'Serves 1' }],
            },
            {
                restaurant: restaurant._id,
                name: 'Rasmalai',
                image: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=300',
                price: 80,
                originalPrice: 100,
                description: 'Soft paneer balls soaked in sweet flavored milk',
                category: 'Sweets',
                isVeg: true,
                rating: 4.8,
                votes: 95,
                isBestSeller: true,
                inStock: true,
                quantityDetails: [{ quantity: 'Serves 2' }],
            },
            {
                restaurant: restaurant._id,
                name: 'Chicken Burger',
                image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300',
                price: 120,
                originalPrice: 150,
                description: 'Juicy chicken patty with lettuce, cheese and mayo',
                category: 'Fast Food',
                isVeg: false,
                rating: 4.4,
                votes: 80,
                isBestSeller: false,
                inStock: true,
                quantityDetails: [{ quantity: 'Serves 1' }],
            },
            {
                restaurant: restaurant._id,
                name: 'Chicken Butter',
                image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=300',
                price: 200,
                originalPrice: 250,
                description: 'Tender chicken in rich creamy butter tomato gravy',
                category: 'Main Course',
                isVeg: false,
                rating: 4.7,
                votes: 110,
                isBestSeller: true,
                inStock: true,
                quantityDetails: [{ quantity: 'Serves 2' }],
            },
        ];

        // Remove any old products for this restaurant first
        await Product.deleteMany({ restaurant: restaurant._id });

        const created = await Product.insertMany(heerProducts);
        console.log(`✅ Added ${created.length} products to Heer Restaurant:`);
        created.forEach(p => console.log(`   - ${p.name} | ₹${p.price}`));

        console.log('\n🎉 Heer Restaurant restored successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

addHeerRestaurant();
