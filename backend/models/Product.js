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
      type: String, // e.g., 'Pizza', 'Burger', 'Drinks'
      required: true,
    },
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
    quantityDetails: {
      type: String, // e.g., "Serves 1", "500ml"
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
