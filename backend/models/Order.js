const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    // New: Explicit Link to Driver
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        name: String,
        price: Number,
        quantity: Number,
        image: String,
        veg: Boolean,
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    // Detailed Bill Breakdown
    billDetails: {
      itemTotal: Number,
      deliveryFee: { type: Number, default: 0 },
      taxes: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      grandTotal: Number,
    },
    // Customer Information
    customerDetails: {
      name: String,
      phone: String,
      address: String,
    },
    // Payment Information
    paymentDetails: {
      method: String, // 'COD', 'UPI', 'CARD', 'WALLET'
      status: {
        type: String,
        enum: ["Pending", "Completed", "Failed", "Refunded"],
        default: "Pending",
      },
      transactionId: String,
    },
    // Driver Details (Legacy + Display)
    driverDetails: {
      name: String,
      phone: String,
      image: String,
      vehicleNumber: String,
      rating: Number,
    },
    status: {
      type: String,
      enum: [
        "Order Placed",
        "Confirmed",
        "Preparing",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
      ],
      default: "Order Placed",
    },
    deliveryAddress: {
      street: String,
      city: String,
      lat: Number,
      lon: Number,
    },
    // Legacy fields for backward compatibility
    paymentMethod: String,
    paymentStatus: String,
    timeline: [
      {
        status: String,
        time: Date,
        description: String,
      },
    ],
    eta: String, // Estimated time of arrival
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
