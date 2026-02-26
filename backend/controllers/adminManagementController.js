const User = require("../models/User");
const Driver = require("../models/Driver");
const Restaurant = require("../models/Restaurant");
const Grocery = require("../models/Grocery");
const Order = require("../models/Order");
const Product = require("../models/Product");

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all drivers
// @route   GET /api/admin/drivers
// @access  Private/Admin
const getAllDrivers = async (req, res) => {
    try {
        const drivers = await Driver.find({}).sort({ createdAt: -1 });
        res.json(drivers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all restaurants
// @route   GET /api/admin/restaurants
// @access  Private/Admin
const getAllRestaurants = async (req, res) => {
    try {
        const restaurants = await Restaurant.find({}).sort({ createdAt: -1 });
        const groceries = await Grocery.find({}).sort({ createdAt: -1 });

        // Combine and sort
        const allStores = [...restaurants, ...groceries].sort((a, b) => b.createdAt - a.createdAt);
        res.json(allStores);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({})
            .populate("user", "name email phone")
            .populate("restaurant", "name")
            .populate("driver", "name phone")
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle user block status (Update status field)
// @route   PATCH /api/admin/users/:id/status
// @access  Private/Admin
const toggleUserStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            const newStatus = user.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
            const updatedUser = await User.findByIdAndUpdate(
                req.params.id,
                { status: newStatus },
                { new: true }
            );

            // If suspended, notify the user via Socket.io to "kick" them
            if (newStatus === "SUSPENDED") {
                const io = req.app.get("io");
                if (io) {
                    io.to(`user_${req.params.id}`).emit("sessionKicked", {
                        message: "Your account has been suspended by the administrator."
                    });
                    console.log(`[Socket] Kicked suspended user: ${req.params.id}`);
                }
            }

            res.json(updatedUser);
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update restaurant approval status
// @route   PATCH /api/admin/restaurants/:id/status
// @access  Private/Admin
const updateRestaurantStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }

        let restaurant = await Restaurant.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!restaurant) {
            restaurant = await Grocery.findByIdAndUpdate(
                req.params.id,
                { status },
                { new: true }
            );
        }

        if (!restaurant) {
            return res.status(404).json({ message: 'Store not found' });
        }

        // If suspended or rejected, emit socket event to kick restaurant session
        if (status === 'SUSPENDED' || status === 'REJECTED') {
            const io = req.app.get('io');
            if (io) {
                io.to(`restaurant_${req.params.id}`).emit('sessionKicked', {
                    message: `Your restaurant account has been ${status.toLowerCase()} by the administrator.`
                });
                console.log(`[Socket] Kicked ${status} restaurant: ${req.params.id}`);
            }
        }

        res.json({ message: `Restaurant status updated to ${status}`, restaurant });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get restaurant menu
// @route   GET /api/admin/restaurants/:id/menu
// @access  Private/Admin
const getRestaurantMenu = async (req, res) => {
    try {
        const products = await Product.find({ restaurant: req.params.id }).sort({ category: 1 });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin: Update driver approval status
// @route   PATCH /api/admin/drivers/:id/status
// @access  Private/Admin
const updateAdminDriverStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED', 'BLOCKED', 'REUPLOAD_REQUIRED'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }

        const driver = await Driver.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!driver) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        // If suspended/blocked, emit socket kick
        if (status === 'SUSPENDED' || status === 'BLOCKED') {
            const io = req.app.get('io');
            if (io) {
                io.to(`driver_${req.params.id}`).emit('sessionKicked', {
                    message: `Your driver account has been ${status.toLowerCase()} by the administrator.`
                });
                console.log(`[Socket] ${status} driver: ${req.params.id}`);
            }
        }

        res.json({ message: `Driver status updated to ${status}`, driver });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllUsers,
    getAllDrivers,
    getAllRestaurants,
    getAllOrders,
    toggleUserStatus,
    updateRestaurantStatus,
    updateAdminDriverStatus,
    getRestaurantMenu
};
