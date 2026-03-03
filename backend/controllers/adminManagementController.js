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

        // If blocked, emit socket kick for forced logout
        if (status === 'BLOCKED') {
            const io = req.app.get('io');
            if (io) {
                io.to(`driver_${req.params.id}`).emit('sessionKicked', {
                    message: "Your driver account has been blocked by the administrator."
                });
                console.log(`[Socket] BLOCKED driver: ${req.params.id}`);
            }
        }

        // If suspended, emit suspension event
        if (status === 'SUSPENDED') {
            const io = req.app.get('io');
            if (io) {
                io.to(`driver_${req.params.id}`).emit('accountSuspended', {
                    message: "Your driver account has been suspended by the administrator."
                });
                console.log(`[Socket] SUSPENDED driver: ${req.params.id}`);
            }
        }

        // If reactivated, emit restore event so app can refresh details
        if (status === 'ACTIVE') {
            const io = req.app.get('io');
            if (io) {
                io.to(`driver_${req.params.id}`).emit('accountRestored', {
                    message: 'Your account has been activated!'
                });
                console.log(`[Socket] RESTORED driver: ${req.params.id}`);
            }
        }

        res.json({ message: `Driver status updated to ${status}`, driver });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get detailed driver stats (Income & Accuracy)
// @route   GET /api/admin/drivers/:id/stats
// @access  Private/Admin
const getDriverStats = async (req, res) => {
    try {
        const driverId = req.params.id;

        // 1. Get Driver Profile
        const driver = await Driver.findById(driverId);
        if (!driver) return res.status(404).json({ message: "Driver not found" });

        // 2. Get Order Analytics
        const allDriverOrders = await Order.find({ driver: driverId });

        const totalAssigned = allDriverOrders.length;
        const delivered = allDriverOrders.filter(o => o.status === 'Delivered').length;
        const cancelled = allDriverOrders.filter(o => o.status === 'Cancelled').length;

        // Calculate Accuracy (Completion Rate)
        const accuracy = totalAssigned > 0
            ? ((delivered / (totalAssigned - (totalAssigned - delivered - cancelled))) * 100).toFixed(1)
            : 100;

        // 3. Financials
        // We can group by day for the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentOrders = allDriverOrders
            .filter(o => o.createdAt >= sevenDaysAgo)
            .sort((a, b) => b.createdAt - a.createdAt);

        const dailyEarnings = {};
        recentOrders.forEach(o => {
            const date = o.createdAt.toISOString().split('T')[0];
            if (o.status === 'Delivered') {
                dailyEarnings[date] = (dailyEarnings[date] || 0) + (o.billDetails?.deliveryFee || 0);
            }
        });

        // 4. Last 5 Orders (Compact for UI)
        const lastOrders = allDriverOrders
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 5)
            .map(o => ({
                id: o._id,
                amount: o.billDetails?.grandTotal,
                fee: o.billDetails?.deliveryFee,
                status: o.status,
                date: o.createdAt
            }));

        res.json({
            driver: {
                name: driver.name,
                rating: driver.rating,
                totalOrders: driver.totalOrders,
                lifetimeEarnings: driver.lifetimeEarnings,
                walletBalance: driver.walletBalance,
                todayOnline: driver.todayOnlineDuration
            },
            stats: {
                totalAssigned,
                delivered,
                cancelled,
                accuracy: parseFloat(accuracy),
                completionRate: totalAssigned > 0 ? ((delivered / totalAssigned) * 100).toFixed(1) : 0
            },
            dailyEarnings,
            lastOrders
        });

    } catch (error) {
        console.error("Driver stats fetch error:", error);
        res.status(500).json({ message: error.message });
    }
};

const getRestaurantStats = async (req, res) => {
    try {
        const restaurantId = req.params.id;

        // 1. Get Restaurant Profile
        let restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            restaurant = await Grocery.findById(restaurantId);
        }
        if (!restaurant) return res.status(404).json({ message: "Store not found" });

        // 2. Get Orders for Analytics
        const allOrders = await Order.find({ restaurant: restaurantId });

        const totalOrders = allOrders.length;
        const deliveredOrders = allOrders.filter(o => o.status === 'Delivered');
        const deliveredCount = deliveredOrders.length;
        const cancelledCount = allOrders.filter(o => o.status === 'Cancelled').length;

        // 3. Financials
        const totalRevenue = deliveredOrders.reduce((sum, o) => sum + (o.billDetails?.grandTotal || 0), 0);
        const totalCommission = deliveredOrders.reduce((sum, o) => {
            const rate = restaurant.commissionRate || 20;
            const subtotal = o.billDetails?.itemTotal || 0;
            return sum + (subtotal * (rate / 100));
        }, 0);

        // 4. Popular Items
        const itemFrequency = {};
        deliveredOrders.forEach(o => {
            o.items.forEach(item => {
                const name = item.name;
                itemFrequency[name] = (itemFrequency[name] || 0) + (item.quantity || 1);
            });
        });

        const popularItems = Object.entries(itemFrequency)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // 5. Recent History
        const recentOrders = allOrders
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 5)
            .map(o => ({
                id: o._id,
                total: o.billDetails?.grandTotal,
                itemsCount: o.items.length,
                status: o.status,
                date: o.createdAt
            }));

        res.json({
            restaurant: {
                name: restaurant.name,
                ownerName: restaurant.ownerName,
                rating: restaurant.rating,
                status: restaurant.status,
                storeType: restaurant.storeType,
                commissionRate: restaurant.commissionRate || 20,
                phone: restaurant.phone,
                email: restaurant.email,
                address: restaurant.address,
                bankDetails: restaurant.bankDetails,
                documentImages: restaurant.documentImages,
                fssaiLicense: restaurant.fssaiLicense,
                gstNumber: restaurant.gstNumber,
                panNumber: restaurant.panNumber,
                image: restaurant.image
            },
            stats: {
                totalOrders,
                deliveredCount,
                cancelledCount,
                totalRevenue: Math.round(totalRevenue),
                totalCommission: Math.round(totalCommission),
                successRate: totalOrders > 0 ? ((deliveredCount / totalOrders) * 100).toFixed(1) : 0
            },
            popularItems,
            recentOrders
        });

    } catch (error) {
        console.error("Restaurant stats fetch error:", error);
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
    getRestaurantMenu,
    getDriverStats,
    getRestaurantStats
};
