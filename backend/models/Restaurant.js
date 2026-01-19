const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String, // URL
      default: "https://via.placeholder.com/300",
    },
    rating: {
      type: Number,
      default: 0,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    deliveryTime: {
      type: String, // e.g., "30-40 min"
      required: true,
    },
    priceRange: {
      type: String, // e.g., "₹₹"
      default: "₹150 for one",
    },
    cuisines: [
      {
        type: String,
      },
    ],
    address: {
      street: String,
      city: String,
      coordinates: {
        lat: Number,
        lon: Number,
      },
    },
    isPromoted: {
      type: Boolean,
      default: false,
    },
    discount: {
      type: String, // e.g., "50% OFF up to ₹100"
    },
    menuCategories: [
      {
        type: String, // Logic grouping like 'Starters', 'Main Course'
      },
    ],
    isOpen: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Restaurant", restaurantSchema);
