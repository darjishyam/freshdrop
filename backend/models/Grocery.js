const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const grocerySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: { type: String, required: true, unique: true },
        password: { type: String },
        ownerName: { type: String, required: true },
        phone: { type: String },
        storeType: {
            type: String,
            default: 'GROCERY'
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
        pushToken: { type: String },
        otp: { type: String },
        otpExpires: { type: Date },

        bankDetails: {
            accountHolderName: String,
            accountNumber: String,
            ifscCode: String,
            bankName: String,
        },

        documentImages: {
            fssai: String,
            pan: String,
            cancelledCheque: String,
        },

        deliveryTime: {
            type: String,
            default: "30-40 min"
        },
        address: {
            street: String,
            city: String,
            zip: String,
            coordinates: {
                lat: Number,
                lon: Number,
            },
        },
        menuCategories: [
            {
                type: String,
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
grocerySchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
});

// Compare password method
grocerySchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Grocery", grocerySchema);
