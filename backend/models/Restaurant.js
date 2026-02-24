const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    ownerName: { type: String, required: true },
    phone: { type: String },
    storeType: {
      type: String,
      enum: ['RESTAURANT', 'GROCERY'],
      default: 'RESTAURANT'
    },
    externalId: {
      type: String,
      unique: true,
      sparse: true, // Allow null for manually added restaurants
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
    // --- Business & Legal Details ---
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'],
      default: 'PENDING'
    },
    isAcceptingOrders: {
      type: Boolean,
      default: true
    },
    fssaiLicense: { type: String },
    gstNumber: { type: String },
    panNumber: { type: String },
    pushToken: { type: String }, // For Expo Push Notifications

    // --- Bank Details ---
    bankDetails: {
      accountHolderName: String,
      accountNumber: String,
      ifscCode: String,
      bankName: String,
    },

    // --- Documents (URLs) ---
    documentImages: {
      fssai: String,
      pan: String,
      cancelledCheque: String,
    },

    // --- Operations ---
    prepTime: { type: Number, default: 20 }, // Average prep time in minutes
    commissionRate: { type: Number, default: 20 }, // Percentage

    // --- Existing Fields ---
    deliveryTime: {
      type: String, // e.g., "30-40 min"
      default: "30-40 min"
    },
    priceRange: {
      type: String, // e.g., "₹₹"
      default: "₹200 for two",
    },
    cuisines: [
      {
        type: String,
      },
    ],
    address: {
      street: String,
      city: String,
      zip: String,
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

// Hash password before saving
restaurantSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare password method
restaurantSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Restaurant", restaurantSchema);
