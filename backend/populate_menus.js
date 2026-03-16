const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');
const Product = require('./models/Product');
require('dotenv').config();

async function populateMenus() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Get the 3 restaurants
        const pratibha = await Restaurant.findOne({ name: 'Pratibha Restaurant' });
        const sampatti = await Restaurant.findOne({ name: 'Sampatti Restaurant' });
        const newRest = await Restaurant.findOne({ name: 'New Restaurant' });

        if (!pratibha || !sampatti || !newRest) {
            console.log('❌ Could not find all 3 restaurants');
            process.exit(1);
        }

        // Delete old Thali + Paneer Tikka products from these 3
        await Product.deleteMany({ restaurant: { $in: [pratibha._id, sampatti._id, newRest._id] } });
        console.log('🗑️ Removed old placeholder products');

        // ===== PRATIBHA RESTAURANT — North Indian, Gujarati, Punjabi =====
        const pratibhaItems = [
            {
                restaurant: pratibha._id,
                name: 'Paneer Butter Masala',
                image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300',
                price: 220,
                originalPrice: 280,
                description: 'Soft paneer cubes in rich buttery tomato gravy',
                category: 'Main Course',
                isVeg: true,
                rating: 4.7,
                votes: 85,
                isBestSeller: true,
                inStock: true,
                quantityDetails: [{ quantity: 'Serves 2' }],
            },
            {
                restaurant: pratibha._id,
                name: 'Chicken Biryani',
                image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300',
                price: 250,
                originalPrice: 320,
                description: 'Fragrant basmati rice with spiced chicken and aromatic herbs',
                category: 'Biryani',
                isVeg: false,
                rating: 4.8,
                votes: 120,
                isBestSeller: true,
                inStock: true,
                quantityDetails: [{ quantity: 'Serves 2' }],
            },
            {
                restaurant: pratibha._id,
                name: 'Veg Pizza',
                image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300',
                price: 199,
                originalPrice: 250,
                description: 'Loaded with capsicum, onions, olives and mozzarella',
                category: 'Pizza',
                isVeg: true,
                rating: 4.3,
                votes: 60,
                isBestSeller: false,
                inStock: true,
                quantityDetails: [{ quantity: 'Serves 2' }],
            },
            {
                restaurant: pratibha._id,
                name: 'Gulab Jamun',
                image: 'https://images.unsplash.com/photo-1666190059767-f0a0fdc14e87?w=300',
                price: 60,
                originalPrice: 80,
                description: 'Deep fried milk balls soaked in sugar syrup',
                category: 'Desserts',
                isVeg: true,
                rating: 4.6,
                votes: 90,
                isBestSeller: true,
                inStock: true,
                quantityDetails: [{ quantity: '2 Pcs' }],
            },
            {
                restaurant: pratibha._id,
                name: 'Masala Chai',
                image: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=300',
                price: 30,
                originalPrice: 40,
                description: 'Traditional Indian spiced tea with ginger and cardamom',
                category: 'Beverages',
                isVeg: true,
                rating: 4.5,
                votes: 200,
                isBestSeller: false,
                inStock: true,
                quantityDetails: [{ quantity: '1 Cup' }],
            },
            {
                restaurant: pratibha._id,
                name: 'Samosa',
                image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300',
                price: 25,
                originalPrice: 35,
                description: 'Crispy triangle pastry stuffed with spiced potato filling',
                category: 'Samosa',
                isVeg: true,
                rating: 4.4,
                votes: 150,
                isBestSeller: true,
                inStock: true,
                quantityDetails: [{ quantity: '2 Pcs' }],
            },
            {
                restaurant: pratibha._id,
                name: 'Paneer Roll',
                image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=300',
                price: 120,
                originalPrice: 150,
                description: 'Grilled paneer wrapped in soft roti with mint chutney',
                category: 'Rolls & Wraps',
                isVeg: true,
                rating: 4.3,
                votes: 45,
                isBestSeller: false,
                inStock: true,
                quantityDetails: [{ quantity: 'Serves 1' }],
            },
        ];

        // ===== SAMPATTI RESTAURANT — Indian, Chinese, Fast Food =====
        const sampattiItems = [
            {
                restaurant: sampatti._id,
                name: 'Classic Burger',
                image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300',
                price: 150,
                originalPrice: 200,
                description: 'Juicy chicken patty with fresh lettuce, tomato and cheese',
                category: 'Burgers',
                isVeg: false,
                rating: 4.5,
                votes: 130,
                isBestSeller: true,
                inStock: true,
                quantityDetails: [{ quantity: 'Serves 1' }],
            },
            {
                restaurant: sampatti._id,
                name: 'Veg Biryani',
                image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=300',
                price: 180,
                originalPrice: 220,
                description: 'Aromatic basmati rice with mixed vegetables and spices',
                category: 'Biryani',
                isVeg: true,
                rating: 4.4,
                votes: 75,
                isBestSeller: false,
                inStock: true,
                quantityDetails: [{ quantity: 'Serves 2' }],
            },
            {
                restaurant: sampatti._id,
                name: 'Tandoori Chicken',
                image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=300',
                price: 280,
                originalPrice: 350,
                description: 'Charcoal grilled chicken marinated in yogurt and spices',
                category: 'Chicken',
                isVeg: false,
                rating: 4.7,
                votes: 110,
                isBestSeller: true,
                inStock: true,
                quantityDetails: [{ quantity: 'Half' }],
            },
            {
                restaurant: sampatti._id,
                name: 'Chocolate Lava Cake',
                image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=300',
                price: 150,
                originalPrice: 200,
                description: 'Warm chocolate cake with molten center and vanilla ice cream',
                category: 'Chocolate Lava Cake',
                isVeg: true,
                rating: 4.9,
                votes: 95,
                isBestSeller: true,
                inStock: true,
                quantityDetails: [{ quantity: 'Serves 1' }],
            },
            {
                restaurant: sampatti._id,
                name: 'Cold Coffee',
                image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300',
                price: 80,
                originalPrice: 100,
                description: 'Chilled coffee blended with ice cream and chocolate',
                category: 'Beverages',
                isVeg: true,
                rating: 4.6,
                votes: 88,
                isBestSeller: false,
                inStock: true,
                quantityDetails: [{ quantity: '1 Glass' }],
            },
            {
                restaurant: sampatti._id,
                name: 'Egg Roll',
                image: 'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?w=300',
                price: 90,
                originalPrice: 120,
                description: 'Fluffy egg omelette wrapped in paratha with onions and chutney',
                category: 'Rolls & Wraps',
                isVeg: false,
                rating: 4.3,
                votes: 65,
                isBestSeller: false,
                inStock: true,
                quantityDetails: [{ quantity: 'Serves 1' }],
            },
            {
                restaurant: sampatti._id,
                name: 'Dal Makhani',
                image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300',
                price: 180,
                originalPrice: 220,
                description: 'Creamy black lentils slow cooked with butter and cream',
                category: 'Main Course',
                isVeg: true,
                rating: 4.5,
                votes: 70,
                isBestSeller: false,
                inStock: true,
                quantityDetails: [{ quantity: 'Serves 2' }],
            },
        ];

        // ===== NEW RESTAURANT — Snacks, Street Food, Beverages =====
        const newRestItems = [
            {
                restaurant: newRest._id,
                name: 'Vadapav',
                image: 'https://images.unsplash.com/photo-1606491956689-2ea866880049?w=300',
                price: 30,
                originalPrice: 40,
                description: 'Mumbai style batata vada in pav with garlic and tamarind chutney',
                category: 'Vadapau',
                isVeg: true,
                rating: 4.6,
                votes: 180,
                isBestSeller: true,
                inStock: true,
                quantityDetails: [{ quantity: 'Serves 1' }],
            },
            {
                restaurant: newRest._id,
                name: 'Chicken Wings',
                image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=300',
                price: 220,
                originalPrice: 280,
                description: 'Crispy fried wings tossed in spicy buffalo sauce',
                category: 'Chicken',
                isVeg: false,
                rating: 4.5,
                votes: 95,
                isBestSeller: true,
                inStock: true,
                quantityDetails: [{ quantity: '6 Pcs' }],
            },
            {
                restaurant: newRest._id,
                name: 'Margherita Pizza',
                image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=300',
                price: 249,
                originalPrice: 299,
                description: 'Classic Italian pizza with fresh mozzarella and basil',
                category: 'Pizza',
                isVeg: true,
                rating: 4.4,
                votes: 100,
                isBestSeller: false,
                inStock: true,
                quantityDetails: [{ quantity: 'Serves 2' }],
            },
            {
                restaurant: newRest._id,
                name: 'Aloo Tikki Burger',
                image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=300',
                price: 80,
                originalPrice: 100,
                description: 'Crispy potato patty with lettuce, mayo and tangy sauce',
                category: 'Burgers',
                isVeg: true,
                rating: 4.2,
                votes: 140,
                isBestSeller: false,
                inStock: true,
                quantityDetails: [{ quantity: 'Serves 1' }],
            },
            {
                restaurant: newRest._id,
                name: 'Mango Lassi',
                image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=300',
                price: 60,
                originalPrice: 80,
                description: 'Refreshing yogurt drink blended with ripe mangoes',
                category: 'Beverages',
                isVeg: true,
                rating: 4.7,
                votes: 110,
                isBestSeller: true,
                inStock: true,
                quantityDetails: [{ quantity: '1 Glass' }],
            },
            {
                restaurant: newRest._id,
                name: 'Samosa Chaat',
                image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300',
                price: 50,
                originalPrice: 70,
                description: 'Crushed samosa topped with curd, chutneys and sev',
                category: 'Samosa',
                isVeg: true,
                rating: 4.5,
                votes: 85,
                isBestSeller: false,
                inStock: true,
                quantityDetails: [{ quantity: 'Serves 1' }],
            },
            {
                restaurant: newRest._id,
                name: 'Brownie with Ice Cream',
                image: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=300',
                price: 130,
                originalPrice: 160,
                description: 'Warm chocolate brownie served with a scoop of vanilla ice cream',
                category: 'Desserts',
                isVeg: true,
                rating: 4.8,
                votes: 70,
                isBestSeller: true,
                inStock: true,
                quantityDetails: [{ quantity: 'Serves 1' }],
            },
        ];

        const allProducts = [...pratibhaItems, ...sampattiItems, ...newRestItems];
        const created = await Product.insertMany(allProducts);

        console.log(`\n✅ Created ${created.length} products total:`);
        console.log(`\n📍 Pratibha Restaurant (${pratibhaItems.length} items):`);
        pratibhaItems.forEach(p => console.log(`   - ${p.name} (${p.category}) ₹${p.price}`));
        console.log(`\n📍 Sampatti Restaurant (${sampattiItems.length} items):`);
        sampattiItems.forEach(p => console.log(`   - ${p.name} (${p.category}) ₹${p.price}`));
        console.log(`\n📍 New Restaurant (${newRestItems.length} items):`);
        newRestItems.forEach(p => console.log(`   - ${p.name} (${p.category}) ₹${p.price}`));

        console.log('\n🎉 All restaurants populated with diverse menu items!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

populateMenus();
