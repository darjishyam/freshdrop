const Restaurant = require('../models/Restaurant');
const jwt = require('jsonwebtoken');

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
        name, email, password, ownerName, phone,
        address, priceRange, deliveryTime, image,
        fssaiLicense, gstNumber, panNumber, bankDetails, documentImages,
        storeType, cuisines
    } = req.body;

    try {
        const restaurantExists = await Restaurant.findOne({ email });

        if (restaurantExists) {
            return res.status(400).json({ message: 'Restaurant already exists' });
        }

        const restaurant = await Restaurant.create({
            name,
            email,
            password,
            ownerName,
            phone,
            cuisines: cuisines || [],
            address,
            priceRange,
            deliveryTime,
            image,
            fssaiLicense,
            gstNumber,
            panNumber,
            bankDetails,
            documentImages,
            storeType,
            status: 'PENDING'
        });

        if (restaurant) {
            res.status(201).json({
                _id: restaurant._id,
                name: restaurant.name,
                email: restaurant.email,
                storeType: restaurant.storeType,
                status: restaurant.status,
                message: "Registration successful. Pending Admin Approval."
            });
        } else {
            res.status(400).json({ message: 'Invalid restaurant data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth restaurant & get token
// @route   POST /api/auth/restaurant/login
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const restaurant = await Restaurant.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });

        if (restaurant && (await restaurant.matchPassword(password))) {
            if (restaurant.status !== 'APPROVED') {
                return res.status(403).json({
                    message: `Your account is ${restaurant.status}. Please wait for admin approval.`
                });
            }

            res.json({
                _id: restaurant._id,
                name: restaurant.name,
                email: restaurant.email,
                storeType: restaurant.storeType,
                token: generateToken(restaurant._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current restaurant profile
// @route   GET /api/auth/restaurant/profile
const getProfile = async (req, res) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const restaurant = await Restaurant.findById(decoded.id).select('-password');
            res.json(restaurant);
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
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
        await Restaurant.updateMany(
            { pushToken: pushToken, email: { $ne: email } },
            { $set: { pushToken: null } }
        );

        const restaurant = await Restaurant.findOne({ email });

        if (restaurant) {
            restaurant.pushToken = pushToken;
            const updatedRestaurant = await restaurant.save();
            res.json({
                _id: updatedRestaurant._id,
                name: updatedRestaurant.name,
                email: updatedRestaurant.email,
                pushToken: updatedRestaurant.pushToken,
                token: generateToken(updatedRestaurant._id),
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
            if (restaurant && (restaurant.pushToken === pushToken || !pushToken)) {
                restaurant.pushToken = null;
                await restaurant.save();
                console.log(`🧹 Cleared Push Token for: ${email}`);
            }
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
            const restaurant = await Restaurant.findById(decoded.id);

            if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

            const { priceRange, deliveryTime, discount, image, isOpen } = req.body;

            if (priceRange !== undefined) restaurant.priceRange = priceRange;
            if (deliveryTime !== undefined) restaurant.deliveryTime = deliveryTime;
            if (discount !== undefined) restaurant.discount = discount;
            if (image !== undefined) restaurant.image = image;
            if (isOpen !== undefined) restaurant.isOpen = isOpen;

            await restaurant.save();

            if (isOpen !== undefined) {
                const io = req.app.get("io");
                if (io) {
                    io.emit("restaurantStatusChanged", {
                        restaurantId: restaurant._id.toString(),
                        isOpen: restaurant.isOpen
                    });
                    console.log(`📡 Emitted restaurantStatusChanged via merged backend: ${restaurant._id}`);
                }
            }

            res.json({ message: 'Profile updated', restaurant });
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
    updateProfile
};
