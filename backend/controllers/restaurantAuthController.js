const Restaurant = require('../models/Restaurant');
const Grocery = require('../models/Grocery');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/emailSender');

const shouldLogOtp = () =>
    process.env.LOG_OTPS === "true" || process.env.NODE_ENV !== "production";

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new restaurant
// @route   POST /api/auth/restaurant/signup
const signup = async (req, res) => {
    const {
        name, email, ownerName, phone,
        address, priceRange, deliveryTime, image,
        fssaiLicense, gstNumber, panNumber, bankDetails, documentImages,
        storeType, cuisines
    } = req.body;

    try {
        // Check both collections for existing email/phone
        const restaurantExists = await Restaurant.findOne({
            $or: [{ email: email.toLowerCase() }, { phone: phone }]
        });
        const groceryExists = await Grocery.findOne({
            $or: [{ email: email.toLowerCase() }, { phone: phone }]
        });

        if (restaurantExists || groceryExists) {
            return res.status(400).json({ message: `Email or Phone number already registered` });
        }

        let store;
        if (storeType === 'GROCERY') {
            store = await Grocery.create({
                name, email, ownerName, phone,
                address, priceRange, deliveryTime, image,
                fssaiLicense, gstNumber, panNumber, bankDetails, documentImages,
                status: 'PENDING'
            });
        } else {
            store = await Restaurant.create({
                name, email, ownerName, phone, cuisines: cuisines || [],
                address, priceRange, deliveryTime, image,
                fssaiLicense, gstNumber, panNumber, bankDetails, documentImages,
                status: 'PENDING'
            });
        }

        if (store) {
            res.status(201).json({
                _id: store._id,
                name: store.name,
                email: store.email,
                storeType: storeType || 'RESTAURANT',
                status: store.status,
                message: "Registration successful. Pending Admin Approval."
            });
        } else {
            res.status(400).json({ message: 'Invalid restaurant data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth restaurant & get token (Redirects to OTP)
// @route   POST /api/auth/restaurant/login
const login = async (req, res) => {
    res.status(400).json({ message: 'Password login is disabled. Please use OTP login.' });
};

// @desc    Request OTP for Restaurant Login
// @route   POST /api/restaurant-auth/request-otp
const requestOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const restaurant = await Restaurant.findOne({
            email: { $regex: new RegExp(`^${email}$`, 'i') }
        });

        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        // Removed GROCERY check because we now use separate requestOtp/requestGroceryOtp endpoints

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        if (shouldLogOtp()) {
            console.log("--------------------------------");
            console.log("RESTAURANT DEV OTP:", otp);
            console.log("--------------------------------");
        }

        restaurant.otp = otp;
        restaurant.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await restaurant.save();

        const brandingColor = "#FC8019";
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: ${brandingColor}; padding: 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">FreshDrop Partner</h1>
                </div>
                <div style="padding: 30px; background-color: #ffffff;">
                    <p style="font-size: 16px; color: #333;">Hello <strong>${restaurant.name}</strong>!</p>
                    <p style="font-size: 16px; color: #555;">Use the code below to securely log into your FreshDrop Partner account:</p>
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: ${brandingColor};">${otp}</span>
                    </div>
                    <p style="font-size: 14px; color: #777;">This code is valid for 10 minutes. Please do not share this with anyone.</p>
                </div>
                <div style="background-color: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #999;">
                    &copy; ${new Date().getFullYear()} FreshDrop. All rights reserved.
                </div>
            </div>
        `;

        try {
            await sendEmail({
                email: restaurant.email,
                subject: "FreshDrop Partner Login Code",
                message: `Your login code is ${otp}`,
                html: htmlContent,
            });

            res.status(200).json({
                message: 'OTP sent successfully',
                email: restaurant.email,
                ...(shouldLogOtp() ? { devOtp: otp } : {})
            });
        } catch (emailError) {
            console.error("Failed to send OTP email:", emailError);
            res.status(500).json({ message: 'Failed to send OTP email' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify OTP for Restaurant Login
// @route   POST /api/restaurant-auth/verify-otp
const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }

        const restaurant = await Restaurant.findOne({
            email: { $regex: new RegExp(`^${email}$`, 'i') }
        });

        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        // Removed GROCERY check

        if (restaurant.otp !== otp || restaurant.otpExpires < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Clear OTP
        restaurant.otp = undefined;
        restaurant.otpExpires = undefined;
        await restaurant.save();

        res.json({
            _id: restaurant._id,
            name: restaurant.name,
            email: restaurant.email,
            storeType: restaurant.storeType,
            status: restaurant.status,
            token: generateToken(restaurant._id),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Request OTP for Grocery Login
// @route   POST /api/restaurant-auth/request-grocery-otp
const requestGroceryOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const store = await Grocery.findOne({
            email: { $regex: new RegExp(`^${email}$`, 'i') }
        });

        if (!store) {
            return res.status(404).json({ message: 'Grocery Store not found' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        if (shouldLogOtp()) {
            console.log("--------------------------------");
            console.log("GROCERY DEV OTP:", otp);
            console.log("--------------------------------");
        }

        store.otp = otp;
        store.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await store.save();

        const brandingColor = "#16a34a"; // Green for grocery
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: ${brandingColor}; padding: 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Instamart Partner</h1>
                </div>
                <div style="padding: 30px; background-color: #ffffff;">
                    <p style="font-size: 16px; color: #333;">Hello <strong>${store.name}</strong>!</p>
                    <p style="font-size: 16px; color: #555;">Use the code below to securely log into your Instamart Partner account:</p>
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: ${brandingColor};">${otp}</span>
                    </div>
                    <p style="font-size: 14px; color: #777;">This code is valid for 10 minutes. Please do not share this with anyone.</p>
                </div>
                <div style="background-color: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #999;">
                    &copy; ${new Date().getFullYear()} FreshDrop. All rights reserved.
                </div>
            </div>
        `;

        try {
            await sendEmail({
                email: store.email,
                subject: "Instamart Partner Login Code",
                message: `Your login code is ${otp}`,
                html: htmlContent,
            });

            res.status(200).json({
                message: 'OTP sent successfully',
                email: store.email,
                ...(shouldLogOtp() ? { devOtp: otp } : {})
            });
        } catch (emailError) {
            console.error("Failed to send OTP email:", emailError);
            res.status(500).json({ message: 'Failed to send OTP email' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify OTP for Grocery Login
// @route   POST /api/restaurant-auth/verify-grocery-otp
const verifyGroceryOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }

        const store = await Grocery.findOne({
            email: { $regex: new RegExp(`^${email}$`, 'i') }
        });

        if (!store) {
            return res.status(404).json({ message: 'Grocery Store not found' });
        }

        if (store.otp !== otp || store.otpExpires < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Clear OTP
        store.otp = undefined;
        store.otpExpires = undefined;
        await store.save();

        res.json({
            _id: store._id,
            name: store.name,
            email: store.email,
            storeType: 'GROCERY',
            status: store.status,
            token: generateToken(store._id),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current restaurant profile
// @route   GET /api/auth/restaurant/profile
const getProfile = async (req, res) => {
    try {
        // req.user is already populated by the 'protect' middleware
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        res.json(req.user);
    } catch (error) {
        console.error("getProfile error:", error);
        res.status(500).json({ message: 'Server error fetching profile' });
    }
};

// @desc    Update Push Token
// @route   PUT /api/auth/restaurant/push-token
const updatePushToken = async (req, res) => {
    const { email, pushToken } = req.body;

    if (!email || !pushToken) {
        return res.status(400).json({ message: 'Email and Push Token are required' });
    }

    try {
        // Check both collections
        const restaurant = await Restaurant.findOne({ email });
        const grocery = await Grocery.findOne({ email });

        if (restaurant) {
            restaurant.pushToken = pushToken;
            await restaurant.save();
            res.json({
                _id: restaurant._id,
                name: restaurant.name,
                email: restaurant.email,
                pushToken: restaurant.pushToken,
                token: generateToken(restaurant._id),
            });
        } else if (grocery) {
            grocery.pushToken = pushToken;
            await grocery.save();
            res.json({
                _id: grocery._id,
                name: grocery.name,
                email: grocery.email,
                pushToken: grocery.pushToken,
                token: generateToken(grocery._id),
            });
        } else {
            res.status(404).json({ message: 'Restaurant not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Logout & Clear Push Token
// @route   POST /api/auth/restaurant/logout
const logout = async (req, res) => {
    const { email, pushToken } = req.body;
    try {
        if (email) {
            const restaurant = await Restaurant.findOne({ email });
            const grocery = await Grocery.findOne({ email });

            if (restaurant && (restaurant.pushToken === pushToken || !pushToken)) {
                restaurant.pushToken = null;
                await restaurant.save();
            } else if (grocery && (grocery.pushToken === pushToken || !pushToken)) {
                grocery.pushToken = null;
                await grocery.save();
            }
            console.log(`🧹 Cleared Push Token for: ${email}`);
        }
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update restaurant profile settings
// @route   PUT /api/auth/restaurant/profile
const updateProfile = async (req, res) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            let store = await Restaurant.findById(decoded.id);
            if (!store) store = await Grocery.findById(decoded.id);

            if (!store) return res.status(404).json({ message: 'Store not found' });

            const { priceRange, deliveryTime, discount, image, isOpen } = req.body;

            if (priceRange !== undefined) store.priceRange = priceRange;
            if (deliveryTime !== undefined) store.deliveryTime = deliveryTime;
            if (discount !== undefined) store.discount = discount;
            if (image !== undefined) store.image = image;
            if (isOpen !== undefined) store.isOpen = isOpen;

            await store.save();

            if (isOpen !== undefined) {
                const io = req.app.get("io");
                if (io) {
                    io.emit("restaurantStatusChanged", {
                        restaurantId: store._id.toString(),
                        isOpen: store.isOpen
                    });
                    console.log(`📡 Emitted restaurantStatusChanged via merged backend: ${store._id}`);
                }
            }

            res.json({ message: 'Profile updated', store });
        } catch (error) {
            res.status(401).json({ message: 'Not authorized' });
        }
    } else {
        res.status(401).json({ message: 'No token' });
    }
};

// @desc    Upload Restaurant Documents
// @route   PUT /api/auth/restaurant/upload-documents
const uploadRestaurantDocuments = async (req, res) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            let store = await Restaurant.findById(decoded.id);
            if (!store) store = await Grocery.findById(decoded.id);

            if (!store) return res.status(404).json({ message: 'Store not found' });

            const { documentImages, bankDetails } = req.body;

            if (documentImages) {
                // Initialize if null
                if (!store.documentImages) store.documentImages = {};

                if (documentImages.fssai) store.documentImages.fssai = documentImages.fssai;
                if (documentImages.pan) store.documentImages.pan = documentImages.pan;
                if (documentImages.cancelledCheque) store.documentImages.cancelledCheque = documentImages.cancelledCheque;

                store.markModified('documentImages');
            }

            if (bankDetails) {
                store.bankDetails = { ...store.bankDetails, ...bankDetails };
                store.markModified('bankDetails');
            }

            await store.save();

            res.json({ message: 'Documents updated successfully', status: store.status });
        } catch (error) {
            res.status(401).json({ message: 'Not authorized' });
        }
    } else {
        res.status(401).json({ message: 'No token' });
    }
};

module.exports = {
    signup,
    login,
    getProfile,
    updatePushToken,
    logout,
    updateProfile,
    uploadRestaurantDocuments,
    requestOtp,
    verifyOtp,
    requestGroceryOtp,
    verifyGroceryOtp
};
