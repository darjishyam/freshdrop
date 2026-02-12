const mongoose = require("mongoose");
const Restaurant = require("./models/Restaurant");
const Product = require("./models/Product");
require("dotenv").config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

const sampleRestaurants = [
  {
    name: "Pizza Hut",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400",
    rating: 4.2,
    ratingCount: 1250,
    deliveryTime: "30-40 min",
    priceRange: "₹300 for two",
    cuisines: ["Pizza", "Italian", "Fast Food"],
    address: {
      street: "MG Road",
      city: "Mumbai",
      coordinates: { lat: 19.076, lon: 72.8777 },
    },
    isPromoted: true,
    discount: "50% OFF up to ₹100",
    menuCategories: ["Pizza", "Sides", "Beverages"],
    isOpen: true,
  },
  {
    name: "McDonald's",
    image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400",
    rating: 4.1,
    ratingCount: 2100,
    deliveryTime: "25-35 min",
    priceRange: "₹200 for two",
    cuisines: ["Burgers", "Fast Food", "American"],
    address: {
      street: "Andheri West",
      city: "Mumbai",
      coordinates: { lat: 19.1136, lon: 72.8697 },
    },
    isPromoted: false,
    discount: "40% OFF up to ₹80",
    menuCategories: ["Burgers", "Fries", "Drinks"],
    isOpen: true,
  },
  {
    name: "Domino's Pizza",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400",
    rating: 4.3,
    ratingCount: 1850,
    deliveryTime: "20-30 min",
    priceRange: "₹350 for two",
    cuisines: ["Pizza", "Italian", "Fast Food"],
    address: {
      street: "Bandra West",
      city: "Mumbai",
      coordinates: { lat: 19.0596, lon: 72.8295 },
    },
    isPromoted: true,
    discount: "60% OFF up to ₹120",
    menuCategories: ["Pizza", "Pasta", "Sides"],
    isOpen: true,
  },
  {
    name: "Fresh Mart Grocery",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400",
    rating: 4.5,
    ratingCount: 890,
    deliveryTime: "15-25 min",
    priceRange: "₹500 for basket",
    cuisines: ["Grocery", "Fresh Produce", "Dairy"],
    address: {
      street: "Powai",
      city: "Mumbai",
      coordinates: { lat: 19.1176, lon: 72.906 },
    },
    isPromoted: false,
    discount: "10% OFF up to ₹50",
    menuCategories: ["Vegetables", "Fruits", "Dairy", "Snacks"],
    isOpen: true,
  },
  {
    name: "KFC",
    image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400",
    rating: 4.0,
    ratingCount: 1520,
    deliveryTime: "30-40 min",
    priceRange: "₹400 for two",
    cuisines: ["Chicken", "Fast Food", "American"],
    address: {
      street: "Colaba",
      city: "Mumbai",
      coordinates: { lat: 18.9067, lon: 72.8147 },
    },
    isPromoted: false,
    discount: "30% OFF up to ₹75",
    menuCategories: ["Chicken", "Burgers", "Sides"],
    isOpen: true,
  },
  {
    name: "Swiggy Test - Mehsana",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400",
    rating: 4.8,
    ratingCount: 50,
    deliveryTime: "20-30 min",
    priceRange: "₹150 for two",
    cuisines: ["Gujarati", "North Indian", "Thali"],
    address: {
      street: "Panchot Circle",
      city: "Mehsana",
      coordinates: { lat: 23.63, lon: 72.37 }, // Approx Panchot/Mehsana coords
    },
    isPromoted: true,
    discount: "20% OFF",
    menuCategories: ["Thali", "Sabzi", "Roti"],
    isOpen: true,
  },
];

const seedDatabase = async () => {
  try {
    // Clear existing data
    console.log("🗑️  Clearing existing restaurants and products...");
    await Restaurant.deleteMany({});
    await Product.deleteMany({});

    // Insert restaurants
    console.log("🏪 Creating restaurants...");
    const restaurants = await Restaurant.insertMany(sampleRestaurants);
    console.log(`✅ Created ${restaurants.length} restaurants`);

    // Create products for each restaurant
    console.log("🍕 Creating products...");
    const products = [];

    // Pizza Hut Products
    const pizzaHut = restaurants[0];
    products.push(
      {
        restaurant: pizzaHut._id,
        name: "Margherita Pizza",
        image:
          "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300",
        price: 299,
        originalPrice: 399,
        description: "Classic cheese pizza with tomato sauce",
        category: "Pizza",
        isVeg: true,
        rating: 4.3,
        votes: 245,
        isBestSeller: true,
        quantityDetails: "Serves 2",
      },
      {
        restaurant: pizzaHut._id,
        name: "Pepperoni Pizza",
        image:
          "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=300",
        price: 399,
        originalPrice: 499,
        description: "Loaded with pepperoni and cheese",
        category: "Pizza",
        isVeg: false,
        rating: 4.5,
        votes: 312,
        isBestSeller: true,
        isMustTry: true,
        quantityDetails: "Serves 2",
      },
    );

    // McDonald's Products
    const mcdonalds = restaurants[1];
    products.push(
      {
        restaurant: mcdonalds._id,
        name: "McAloo Tikki Burger",
        image:
          "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300",
        price: 49,
        description: "Crispy potato patty burger",
        category: "Burgers",
        isVeg: true,
        rating: 4.2,
        votes: 450,
        isBestSeller: true,
        quantityDetails: "1 Piece",
      },
      {
        restaurant: mcdonalds._id,
        name: "McChicken Burger",
        image:
          "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=300",
        price: 89,
        originalPrice: 109,
        description: "Crispy chicken burger",
        category: "Burgers",
        isVeg: false,
        rating: 4.4,
        votes: 520,
        isBestSeller: true,
        quantityDetails: "1 Piece",
      },
    );

    // Domino's Products
    const dominos = restaurants[2];
    products.push({
      restaurant: dominos._id,
      name: "Farmhouse Pizza",
      image:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300",
      price: 349,
      originalPrice: 449,
      description: "Loaded with veggies",
      category: "Pizza",
      isVeg: true,
      rating: 4.4,
      votes: 380,
      isBestSeller: true,
      isMustTry: true,
      quantityDetails: "Serves 2",
    });

    // Fresh Mart Grocery Products
    const freshMart = restaurants[3];
    products.push(
      {
        restaurant: freshMart._id,
        name: "Fresh Tomatoes",
        image:
          "https://images.unsplash.com/photo-1546470427-227e1e3b0f6e?w=300",
        price: 40,
        description: "Farm fresh tomatoes",
        category: "Vegetables",
        isVeg: true,
        rating: 4.6,
        votes: 120,
        quantityDetails: "1 kg",
      },
      {
        restaurant: freshMart._id,
        name: "Milk - Full Cream",
        image:
          "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300",
        price: 60,
        description: "Fresh full cream milk",
        category: "Dairy",
        isVeg: true,
        rating: 4.7,
        votes: 200,
        isBestSeller: true,
        quantityDetails: "1 Liter",
      },
    );

    // KFC Products
    const kfc = restaurants[4];
    products.push({
      restaurant: kfc._id,
      name: "Hot & Crispy Chicken",
      image:
        "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=300",
      price: 199,
      originalPrice: 249,
      description: "Signature crispy fried chicken",
      category: "Chicken",
      isVeg: false,
      rating: 4.5,
      votes: 680,
      isBestSeller: true,
      isMustTry: true,
      quantityDetails: "2 Pieces",
    });

    // Mehsana Test Products
    const mehsanaRest = restaurants[5];
    if (mehsanaRest) {
      products.push(
        {
          restaurant: mehsanaRest._id,
          name: "Gujarati Thali",
          image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300",
          price: 120,
          description: "Full Gujarati meal",
          category: "Thali",
          isVeg: true,
          rating: 4.9,
          votes: 45,
          isBestSeller: true,
          quantityDetails: "Serves 1",
        },
        {
          restaurant: mehsanaRest._id,
          name: "Paneer Butter Masala",
          image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300",
          price: 180,
          description: "Rich creamy gravy",
          category: "Sabzi",
          isVeg: true,
          rating: 4.7,
          votes: 30,
          quantityDetails: "Serves 2",
        }
      );
    }

    await Product.insertMany(products);
    console.log(`✅ Created ${products.length} products`);

    console.log("\n🎉 Database seeded successfully!");
    console.log("\n📊 Summary:");
    console.log(`   Restaurants: ${restaurants.length}`);
    console.log(`   Products: ${products.length}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
