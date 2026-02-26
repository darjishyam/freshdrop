const Admin = require("../models/Admin");
const User = require("../models/User");
const Driver = require("../models/Driver");
const Restaurant = require("../models/Restaurant");
const Order = require("../models/Order");
const jwt = require("jsonwebtoken");

// @desc    Auth admin & get token
// @route   POST /api/admin/auth/login
// @access  Public
const loginAdmin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const admin = await Admin.findOne({ email });

        if (admin && (await admin.matchPassword(password))) {
            res.json({
                _id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                token: generateToken(admin._id),
            });
        } else {
            res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalDrivers = await Driver.countDocuments({ isOnline: true });
        const totalRestaurants = await Restaurant.countDocuments();

        // Active Orders: Placed, Confirmed, Preparing, Ready, Out for Delivery
        const liveOrders = await Order.countDocuments({
            status: { $in: ["Order Placed", "Confirmed", "Preparing", "Ready", "Out for Delivery"] }
        });

        // Revenue Aggregation (Delivered orders only)
        const revenueData = await Order.aggregate([
            { $match: { status: "Delivered" } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);

        const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

        // Formatting for UI (matching the StatCard expectations)
        res.json({
            totalUsers: formatNumber(totalUsers),
            totalDrivers: totalDrivers.toString(),
            totalRestaurants: totalRestaurants.toString(),
            totalOrders: liveOrders.toString(),
            totalRevenue: formatNumber(totalRevenue),
            rawValues: { // For future charts
                users: totalUsers,
                drivers: totalDrivers,
                restaurants: totalRestaurants,
                orders: liveOrders,
                revenue: totalRevenue
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
};

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "30d",
    });
};

module.exports = {
    loginAdmin,
    getDashboardStats
};
