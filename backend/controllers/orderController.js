const Order = require("../models/Order");
const User = require("../models/User");
const Driver = require("../models/Driver");
const Restaurant = require("../models/Restaurant");
const { sendPushNotification } = require("../services/notificationService");

// @desc    Place a new order
// @route   POST /api/orders
const createOrder = async (req, res) => {
    try {
        const {
            restaurantId,
            items,
            totalAmount,
            deliveryAddress,
            paymentMethod,
        } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: "No order items" });
        }

        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ message: "Restaurant not found" });
        }

        // Calculate bill details
        const itemTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        // Tiered delivery fee based on number of items
        // 1-2 items: ₹40
        // 3-5 items: ₹60
        // 6+ items: ₹80
        const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
        const deliveryFee = itemCount <= 2 ? 40 : itemCount <= 5 ? 60 : 80;
        const taxes = Math.round(itemTotal * 0.05); // 5% tax
        const grandTotal = itemTotal + deliveryFee + taxes;

        const order = new Order({
            user: req.user._id,
            restaurant: restaurantId,
            items,
            totalAmount: grandTotal,
            billDetails: {
                itemTotal,
                deliveryFee,
                taxes,
                discount: 0,
                grandTotal,
            },
            customerDetails: {
                name: req.user.name || "Customer",
                phone: req.user.phone,
                address: deliveryAddress?.address || "Address not provided",
            },
            paymentDetails: {
                method: paymentMethod || "COD",
                status: paymentMethod === "COD" ? "Pending" : "Completed",
                transactionId: paymentMethod !== "COD" ? `TXN${Date.now()}` : null,
            },
            deliveryAddress,
            paymentMethod,
            paymentMethod,
            paymentStatus: paymentMethod === "COD" ? "Pending" : "Completed",
            status: "Order Placed", // FORCE STATUS
            eta: "30-40 mins",
            timeline: [
                {
                    status: "Order Placed",
                    time: new Date(),
                    description: "Your order has been placed successfully",
                },
            ],
        });

        const createdOrder = await order.save();
        const populatedOrder = await Order.findById(createdOrder._id).populate(
            "restaurant",
            "name image address"
        );

        // Notify User
        // req.app.get('io').to(`user_${req.user._id}`).emit('orderUpdate', populatedOrder);

        // Find Nearby Drivers (5km Radius)
        if (restaurant.address && restaurant.address.coordinates) {
            const { lat, lon } = restaurant.address.coordinates;

            // GeoJSON Query: Drivers within 5km of Restaurant
            const nearbyDrivers = await Driver.find({
                location: {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: [lon, lat] // MongoDB uses [lon, lat]
                        },
                        $maxDistance: 5000 // 5km in meters
                    }
                },
                isOnline: true,
                status: "ACTIVE" // Only ACTIVE drivers
            });

            console.log(`Found ${nearbyDrivers.length} nearby drivers for Order ${createdOrder._id}`);

            // Alert Drivers via Socket
            const io = req.app.get('io');
            if (io) {
                nearbyDrivers.forEach(driver => {
                    io.to(`driver_${driver._id}`).emit('newOrder', {
                        ...populatedOrder.toObject(),
                        restaurantLocation: { latitude: lat, longitude: lon } // Send for distance calc
                    });
                    console.log(`Emitted newOrder to driver_${driver._id}`);
                });
            }

            // Send Push Notifications to Nearby Drivers
            const recipients = nearbyDrivers
                .filter(driver => driver.pushToken)
                .map(driver => ({ userId: driver._id, pushToken: driver.pushToken }));

            if (recipients.length > 0) {
                try {
                    await sendPushNotification(
                        recipients,
                        "New Order Available! 🛵",
                        `New delivery from ${restaurant.name}. Earn ₹${deliveryFee}!`,
                        {
                            orderId: createdOrder._id.toString(),
                            restaurantName: restaurant.name,
                            deliveryFee: deliveryFee.toString(),
                            type: "new_order"
                        },
                        "Driver" // Recipient Model
                    );
                    console.log(`Push notifications sent to ${recipients.length} drivers`);
                } catch (notifError) {
                    console.error("Failed to send push notifications:", notifError);
                    // Don't fail the order if notifications fail
                }
            }
        }

        res.status(201).json(populatedOrder);
    } catch (error) {
        console.error("Order Create Error:", error);
        res.status(500).json({ message: "Failed to place order" });
    }
};

// @desc    Get logged in user orders
// @route   GET /api/orders
const getUserOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .populate("restaurant", "name image address")
            .populate("driver", "name phone vehicleNumber image");

        res.json(orders);
    } catch (error) {
        console.error("Fetch Orders Error:", error);
        res.status(500).json({ message: "Failed to fetch orders" });
    }
};

// @desc    Get Available Orders for Driver
// @route   GET /api/orders/available
const getAvailableOrders = async (req, res) => {
    try {
        const { latitude, longitude } = req.query; // Driver's location

        // Find unassigned orders
        const orders = await Order.find({
            status: "Order Placed",
            driver: null
        }).populate("restaurant");

        // Simple distance filter if lat/lon provided (Fallback since we don't store Order location in GeoJSON yet)
        // Ideally we use $geoNear aggregation, but accessing restaurant location via lookup is complex in simple query.
        // So we filter in code for now.

        let availableOrders = orders;

        if (latitude && longitude) {
            const driverLat = parseFloat(latitude);
            const driverLon = parseFloat(longitude);

            availableOrders = orders.filter(order => {
                if (order.restaurant && order.restaurant.address && order.restaurant.address.coordinates) {
                    const rLat = order.restaurant.address.coordinates.lat;
                    const rLon = order.restaurant.address.coordinates.lon;

                    // Helper: Haversine Distance (km)
                    const R = 6371;
                    const dLat = (rLat - driverLat) * Math.PI / 180;
                    const dLon = (rLon - driverLon) * Math.PI / 180;
                    const a =
                        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos(driverLat * Math.PI / 180) * Math.cos(rLat * Math.PI / 180) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    const d = R * c; // Distance in km

                    return d <= 15; // Increased to 15km Radius for testing
                }
                return false;
            });
        }

        res.json(availableOrders);

    } catch (error) {
        console.error("Fetch Available Orders Error:", error);
        res.status(500).json({ message: "Failed to fetch orders" });
    }
}

// @desc    Accept Order (Driver)
// @route   POST /api/orders/:id/accept
const acceptOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        const driverId = req.user.id;

        // Use atomic findOneAndUpdate to prevent race conditions
        // This ensures only ONE driver can accept the order
        const order = await Order.findOneAndUpdate(
            {
                _id: orderId,
                driver: null  // Only update if driver is still null
            },
            {
                $set: {
                    driver: driverId,
                    status: "Confirmed",
                    driverDetails: {
                        name: req.user.name,
                        phone: req.user.phone,
                        vehicleNumber: req.user.vehicleNumber,
                        image: req.user.profilePhoto
                    }
                },
                $push: {
                    timeline: {
                        status: "Confirmed",
                        time: new Date(),
                        description: `${req.user.name} has accepted your order`
                    }
                }
            },
            { new: true }  // Return the updated document
        );

        // If order is null, it means another driver already accepted it
        if (!order) {
            return res.status(400).json({
                message: "Order already accepted by another driver",
                code: "ORDER_ALREADY_TAKEN"
            });
        }

        const updatedOrder = await Order.findById(orderId)
            .populate("restaurant")
            .populate("driver");

        // Emit Events
        const io = req.app.get('io');
        if (io) {
            // Notify User (if they are in a room, or we broadcast)
            io.emit(`order_${orderId}`, updatedOrder);

            // Remove from other drivers' lists
            io.emit('orderTaken', orderId);
        }

        res.json(updatedOrder);

    } catch (error) {
        console.error("Accept Order Error:", error);
        res.status(500).json({ message: "Failed to accept order" });
    }
}

// @desc    Update Order Status (Driver)
// @route   PUT /api/orders/:id/status
const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const orderId = req.params.id;

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: "Order not found" });

        if (order.driver.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized" });
        }

        // Check if status is actually changing to Delivered to prevent double crediting
        if (status === "Delivered" && order.status !== "Delivered") {
            const driver = await Driver.findById(req.user.id);
            if (driver) {
                const earnings = order.billDetails?.deliveryFee || 0;
                driver.walletBalance = (driver.walletBalance || 0) + earnings;
                driver.lifetimeEarnings = (driver.lifetimeEarnings || 0) + earnings;
                driver.totalOrders = (driver.totalOrders || 0) + 1;
                await driver.save();
                console.log(`Driver ${driver.name} earned ₹${earnings}`);
            }
        }

        order.status = status;

        let description = "";
        if (status === "Preparing") description = "Restaurant is preparing your food";
        if (status === "Out for Delivery") description = "Driver has picked up your order";
        if (status === "Delivered") description = "Order delivered successfully";

        order.timeline.push({
            status,
            time: new Date(),
            description
        });

        await order.save();

        const updatedOrder = await Order.findById(orderId)
            .populate("restaurant")
            .populate("driver");

        const io = req.app.get('io');
        if (io) {
            io.emit(`order_${orderId}`, updatedOrder);
        }

        res.json(updatedOrder);

    } catch (error) {
        console.error("Update Status Error:", error);
        res.status(500).json({ message: "Failed to update status" });
    }
}

// @desc    Get Driver's Active Order
// @route   GET /api/driver/active-order
const getDriverActiveOrder = async (req, res) => {
    try {
        const driverId = req.user.id;

        // Find order assigned to this driver that is NOT delivered or cancelled
        const activeOrder = await Order.findOne({
            driver: driverId,
            status: { $nin: ["Delivered", "Cancelled"] }
        })
            .populate("restaurant")
            .populate("user", "name phone address"); // Populate user details if needed

        if (!activeOrder) {
            return res.status(200).json(null); // No active order
        }

        res.json(activeOrder);

    } catch (error) {
        console.error("Get Active Order Error:", error);
        res.status(500).json({ message: "Failed to fetch active order" });
    }
}

// @desc    Get Driver's Order History
// @route   GET /api/driver/history
const getDriverHistory = async (req, res) => {
    try {
        const driverId = req.user.id;

        const orders = await Order.find({
            driver: driverId,
            status: "Delivered"
        })
            .sort({ createdAt: -1 }) // Newest first
            .limit(20) // Limit to last 20
            .populate("restaurant", "name address image")
            .select("totalAmount billDetails status createdAt deliveryAddress items customerDetails");

        res.json(orders);
    } catch (error) {
        console.error("Get Driver History Error:", error);
        res.status(500).json({ message: "Failed to fetch history" });
    }
}

module.exports = {
    createOrder,
    getUserOrders,
    getAvailableOrders,
    acceptOrder,
    updateOrderStatus,
    getDriverActiveOrder,
    getDriverHistory
};
