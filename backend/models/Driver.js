const mongoose = require("mongoose");

const driverSchema = mongoose.Schema(
    {
        name: {
            type: String,
            // Name is not required initially, only after OTP verification
        },
        email: {
            type: String,
            unique: true,
            sparse: true,
        },
        phone: {
            type: String,
            required: [true, "Please add a phone number"],
            unique: true,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        isOnline: {
            type: Boolean,
            default: false,
        },
        pushToken: {
            type: String, // Expo Push Token
        },
        status: {
            type: String,
            enum: ["PENDING", "ACTIVE", "REJECTED", "REUPLOAD_REQUIRED", "SUSPENDED", "BLOCKED", "onboarding"],
            default: "onboarding",
        },
        vehicleType: {
            type: String, // bike, cycle, car, electric
            default: "bike",
        },
        vehicleNumber: {
            type: String,
        },
        vehicleModel: {
            type: String,
        },
        // UPDATED: GeoJSON format for location queries
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                default: [0, 0]
            },
            address: String
        },
        city: {
            type: String,
        },
        language: {
            type: String,
            default: "en",
        },
        profilePhoto: String,
        documents: {
            aadhaarFront: String,
            aadhaarBack: String,
            drivingLicenseUrl: String,
            rcUrl: String,
        },
        bankDetails: {
            accountNumber: String,
            ifscCode: String,
            holderName: String,
            bankName: String,
        },
        walletBalance: {
            type: Number,
            default: 0,
        },
        lifetimeEarnings: {
            type: Number,
            default: 0,
        },
        totalOrders: {
            type: Number,
            default: 0,
        },
        rating: {
            type: Number,
            default: 0,
        },
        ratingCount: {
            type: Number,
            default: 0,
        },
        otp: String,
        otpExpires: Date,
        // Online Duration Tracking
        onlineSessionStart: Date,
        todayOnlineDuration: {
            type: Number,
            default: 0 // in milliseconds
        },
        lastOnlineUpdate: Date, // To track daily reset
    },
    {
        timestamps: true,
    }
);

// Create 2dsphere index for geospatial queries
driverSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Driver", driverSchema);
