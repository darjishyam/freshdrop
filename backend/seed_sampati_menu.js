const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');
const Product = require('./models/Product');
const dotenv = require('dotenv');

dotenv.config();

const seedMenu = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const r = await Restaurant.findOne({ email: 'Sampat@gmail.com' });
        if (!r) {
            console.log("Restaurant not found");
            process.exit(1);
        }

        const menuItems = [
            {
                name: "Special Chicken Biryani",
                description: "Aromatic basmati rice cooked with tender chicken and spices",
                price: 250,
                category: "Main Course",
                image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500",
                isVeg: false,
                rating: 4.5
            },
            {
                name: "Paneer Butter Masala",
                description: "Rich and creamy paneer curry cooked in tomato gravy",
                price: 220,
                category: "Main Course",
                image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500",
                isVeg: true,
                rating: 4.2
            },
            {
                name: "Garlic Naan",
                description: "Oven-baked flatbread topped with garlic and butter",
                price: 45,
                category: "Breads",
                image: "https://images.unsplash.com/photo-1626074353765-517a681e40be?w=500",
                isVeg: true,
                rating: 4.0
            },
            {
                name: "Gulab Jamun (2 pcs)",
                description: "Soft milk dumplings soaked in sugar syrup",
                price: 60,
                category: "Desserts",
                image: "https://images.unsplash.com/photo-1593701461250-d71f3351dcc3?w=500",
                isVeg: true,
                rating: 4.8
            }
        ];

        for (const item of menuItems) {
            await Product.create({
                restaurant: r._id,
                ...item
            });
            console.log(`Added: ${item.name}`);
        }

        console.log("Menu seeding complete!");
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedMenu();
