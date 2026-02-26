const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: "https://via.placeholder.com/150",
    },
    price: {
      type: Number,
      required: true,
    },
    originalPrice: {
      type: Number, // For strike-through
    },
    description: {
      type: String,
    },
    category: {
      type: String, // e.g., 'Pizza', 'Burger', 'Drinks' or 'Vegetables', 'Dairy'
      required: true,
    },
    // Grocery specific fields
    brandName: { type: String },
    weight: { type: String }, // e.g., "500", "1"
    unit: {
      type: String,
      enum: ['g', 'kg', 'ml', 'l', 'pcs', 'pack', 'None'],
      default: 'None'
    },
    stockQuantity: { type: Number, default: 0 },
    isVeg: {
      type: Boolean,
      default: true,
    },
    rating: {
      type: Number,
      default: 0,
    },
    votes: {
      type: Number,
      default: 0,
    },
    isBestSeller: {
      type: Boolean,
      default: false,
    },
    isMustTry: {
      type: Boolean,
      default: false,
    },
    quantityDetails: [{
      quantity: String,
      price: Number
    }],
    inStock: {
      type: Boolean,
      default: true, 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
