const mongoose = require("mongoose");
const Restaurant = require("./models/Restaurant");
const Product = require("./models/Product");
require("dotenv").config();

// Predefined set of popular food items to randomly add to restaurants
const sampleFoods = [
    {
        name: "Classic Cheeseburger",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300",
        price: 149,
        description: "Juicy beef patty with melted cheese and fresh veggies",
        category: "Burgers",
        isVeg: false,
        rating: 4.5,
        votes: 120,
        isBestSeller: true,
    },
    {
        name: "Veggie Supreme Pizza",
        image: "https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=300",
        price: 349,
        originalPrice: 399,
        description: "Loaded with bell peppers, olives, onions, and mushrooms",
        category: "Pizza",
        isVeg: true,
        rating: 4.6,
        votes: 310,
        isMustTry: true,
    },
    {
        name: "Spicy Chicken Wings",
        image: "https://images.unsplash.com/photo-1569691899455-88464f6d3ab1?w=300",
        price: 249,
        description: "Crispy wings tossed in fiery hot sauce",
        category: "Chicken",
        isVeg: false,
        rating: 4.3,
        votes: 215,
    },
    {
        name: "Paneer Tikka Wrap",
        image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=300", // placeholder
        price: 179,
        description: "Spiced paneer cubes wrapped in a soft tortilla with mint chutney",
        category: "Rolls & Wraps",
        isVeg: true,
        rating: 4.4,
        votes: 180,
    },
    {
        name: "Chocolate Lava Cake",
        image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=300",
        price: 129,
        description: "Warm chocolate cake with a gooey molten center",
        category: "Desserts",
        isVeg: true,
        rating: 4.8,
        votes: 450,
        isBestSeller: true,
    },
    {
        name: "Cold Coffee with Ice Cream",
        image: "https://images.unsplash.com/photo-1461023058943-0701ce514d02?w=300",
        price: 139,
        description: "Rich blended cold coffee topped with vanilla ice cream",
        category: "Beverages",
        isVeg: true,
        rating: 4.7,
        votes: 290,
    },
    {
        name: "Chicken Biryani",
        image: "https://images.unsplash.com/photo-1589302168068-964664d93cb0?w=300",
        price: 289,
        originalPrice: 320,
        description: "Aromatic basmati rice cooked with tender chicken and authentic spices",
        category: "Biryani",
        isVeg: false,
        rating: 4.6,
        votes: 520,
        isMustTry: true,
    },
    {
        name: "Butter Naan",
        image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=300", // placeholder
        price: 45,
        description: "Soft Indian bread cooked in tandoor and brushed with butter",
        category: "Breads",
        isVeg: true,
        rating: 4.5,
        votes: 400,
    },
    {
        name: "Dal Makhani",
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300",
        price: 210,
        description: "Slow-cooked black lentils in a rich, creamy tomato gravy",
        category: "Main Course",
        isVeg: true,
        rating: 4.7,
        votes: 350,
        isBestSeller: true,
    },
    {
        name: "Crispy French Fries",
        image: "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=300",
        price: 99,
        description: "Golden, crispy, and perfectly salted french fries",
        category: "Sides",
        isVeg: true,
        rating: 4.3,
        votes: 220,
    }
];

// Helper to get random subset of array
function getRandomFoods(num) {
    const shuffled = [...sampleFoods].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, num);
}

const addMoreFoods = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error("❌ MONGO_URI is not defined in .env file");
            process.exit(1);
        }

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        

        // Fetch all restaurants
        const restaurants = await Restaurant.find({});

        if (restaurants.length === 0) {
            
            process.exit(0);
        }

        

        let totalAdded = 0;
        const newProducts = [];

        // Loop through each restaurant and add 3 to 6 random food items
        for (const restaurant of restaurants) {
            const numFoodsToAdd = Math.floor(Math.random() * 4) + 3; // Randoomly add 3 to 6 items
            const selectedFoods = getRandomFoods(numFoodsToAdd);

            // Track new categories to update restaurant later
            const newCategories = new Set(restaurant.menuCategories || []);

            for (const food of selectedFoods) {
                newCategories.add(food.category);

                // Add to batch insert array
                newProducts.push({
                    ...food,
                    restaurant: restaurant._id,
                });
            }

            // Update the restaurant's menu categories in database
            await Restaurant.findByIdAndUpdate(restaurant._id, {
                menuCategories: Array.from(newCategories)
            });

            totalAdded += numFoodsToAdd;
            
        }

        // Insert all new products into database
        if (newProducts.length > 0) {
            
            await Product.insertMany(newProducts);
            
        } else {
            
        }

        process.exit(0);
    } catch (error) {
        console.error("❌ Error adding foods:", error);
        process.exit(1);
    }
};

addMoreFoods();
