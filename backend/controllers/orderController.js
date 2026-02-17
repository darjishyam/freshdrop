const fs = require("fs");
const path = require("path");
const Order = require("../models/Order");
const User = require("../models/User");
const Driver = require("../models/Driver");
const Restaurant = require("../models/Restaurant");
const { sendPushNotification } = require("../services/notificationService");

const logFile = path.join(__dirname, "../logs/order_dispatch.log");
// Ensure logs directory exists
if (!fs.existsSync(path.dirname(logFile))) {
    fs.mkdirSync(path.dirname(logFile), { recursive: true });
}

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
            const targetCity = restaurant.address.city || "";

            // Normalize city for comparison (Mehsana vs Mahesana vs Mehasana)
            const mehsanaSynonyms = ["mehsana", "mahesana", "mehasana"];
            const normalizedTarget = targetCity.toLowerCase().trim();
            const isMehsana = mehsanaSynonyms.includes(normalizedTarget) || normalizedTarget.match(/m[ae]h[ae]?sana/);

            // 1. Define City Query
            let cityQuery;
            if (isMehsana) {
                cityQuery = { $regex: /m[ae]h[ae]?sana/i };
            } else if (targetCity) {
                cityQuery = { $regex: new RegExp(`^${targetCity}$`, "i") };
            } else {
                // If NO city in restaurant, don't filter by city in the PRIMARY geo-search
                // This allows GPS-only matching for cityless restaurants
                cityQuery = { $exists: true };
            }

            // 1. Primary GeoJSON Query: Drivers within 5km of Restaurant AND in same City
            let nearbyDrivers = await Driver.find({
                location: {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: [lon, lat] // MongoDB uses [lon, lat]
                        },
                        $maxDistance: 10000 // Increased to 10km for wider real-time reach
                    }
                },
                isOnline: true,
                status: { $in: ["ACTIVE", "onboarding", "PENDING"] },
                city: cityQuery
            });

            // 2. FALLBACK: Search by City Only if no drivers found by GPS 
            // OR if it's Mehsana (Small city, notify everyone for better testing/reliability)
            if (nearbyDrivers.length === 0 || isMehsana) {
                const searchMsg = isMehsana
                    ? `[ORDER_CREATE] Mehsana order detected. Notifying ALL online drivers in city.\n`
                    : `[ORDER_CREATE] No drivers found within 10km. Falling back to City Search for: ${targetCity}\n`;

                console.log(searchMsg);
                try { fs.appendFileSync(logFile, new Date().toISOString() + ' ' + searchMsg); } catch (e) { }

                const cityDrivers = await Driver.find({
                    isOnline: true,
                    status: { $in: ["ACTIVE", "onboarding", "PENDING"] },
                    city: cityQuery,
                    _id: { $nin: nearbyDrivers.map(d => d._id) } // Don't duplicate
                });

                nearbyDrivers = [...nearbyDrivers, ...cityDrivers];

                const countMsg = `[ORDER_CREATE] Final notification list size: ${nearbyDrivers.length} drivers.\n`;
                console.log(countMsg);
                try { fs.appendFileSync(logFile, new Date().toISOString() + ' ' + countMsg); } catch (e) { }
            }

            if (nearbyDrivers.length > 0) {
                nearbyDrivers.forEach(d => {
                    const detailMsg = `   -> Driver: ${d._id} City: ${d.city} Loc: ${d.location?.coordinates}\n`;
                    console.log(detailMsg);
                    try { fs.appendFileSync(logFile, detailMsg); } catch (e) { }
                });
            }

            // Alert Drivers via Socket
            const io = req.app.get('io');

            // NEW: Broadcast to entire city room
            // This ensures "Available Orders" tab updates for EVERYONE in the city
            const getBroadcastCity = (c) => {
                if (!c) return "unknown";
                const normalized = c.toLowerCase().trim();
                if (normalized.match(/m[ae]h[ae]?sana/i)) return "mehsana";
                return normalized.replace(/\s+/g, '_');
            };
            const cityRoom = `city_${getBroadcastCity(targetCity)}`;

            if (io) {
                // 1. Notify targeted GPS drivers (Personalized)
                nearbyDrivers.forEach(driver => {
                    io.to(`driver_${driver._id}`).emit('newOrder', {
                        ...populatedOrder.toObject(),
                        restaurantLocation: { latitude: lat, longitude: lon }
                    });
                });

                // 2. Broadcast to city room (General update for Available Orders Tab)
                io.to(cityRoom).emit('newOrder', {
                    ...populatedOrder.toObject(),
                    restaurantLocation: { latitude: lat, longitude: lon }
                });
                console.log(`📡 Broadcasted newOrder to ${cityRoom} and ${nearbyDrivers.length} targeted drivers`);
            }

            // Send Push Notifications to Nearby Drivers
            const recipients = nearbyDrivers
                .filter(driver => driver.pushToken)
                .map(driver => ({ userId: driver._id, pushToken: driver.pushToken }));

            const recipientLogs = `[ORDER_CREATE] Push Recipients: ${JSON.stringify(recipients)}\n`;
            console.log(recipientLogs);
            try { fs.appendFileSync(logFile, new Date().toISOString() + ' ' + recipientLogs); } catch (e) { }

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

        // 1. Get Driver's City from DB
        const driver = await Driver.findById(req.user._id);
        const driverCity = driver?.city;

        // Filter: Last 3 Hours Only
        const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);

        // Find unassigned orders, sorted by newest first
        let query = {
            status: "Order Placed",
            driver: null,
            createdAt: { $gt: threeHoursAgo }
        };

        const orders = await Order.find(query)
            .sort({ createdAt: -1 }) // Newest First
            .populate("restaurant");

        // Filter by City & Distance
        let availableOrders = orders.filter(order => {
            // 2. City Check (with spelling normalization)
            const getNormalizedCity = (c) => {
                if (!c) return "";
                const normalized = c.toLowerCase().trim();
                // Match anything like mehsana/mahesana/mehasana/mehshana
                if (normalized.match(/m[ae]h[ae]?sana/i)) return "mehsana";
                return normalized;
            };

            const restaurantCityRaw = order.restaurant?.address?.city || "";
            const restaurantCity = getNormalizedCity(restaurantCityRaw);
            const dCity = getNormalizedCity(driverCity);

            // If both have city data, and they don't match, filter out.
            // BUT: If restaurant has NO city, we'll let it pass to the GPS check.
            if (dCity && restaurantCity && restaurantCity !== dCity) {
                return false;
            }
            return true;
        });

        if (latitude && longitude) {
            const driverLat = parseFloat(latitude);
            const driverLon = parseFloat(longitude);

            availableOrders = availableOrders.filter(order => {
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

                    // If it's in the same city, be very lenient (100km)
                    // If no city match was done (restaurantCity empty), be strict (15km)
                    const restaurantCityRaw = order.restaurant?.address?.city || "";
                    const isCityMatch = restaurantCityRaw && driverCity &&
                        restaurantCityRaw.toLowerCase() === driverCity.toLowerCase();

                    return isCityMatch ? d <= 100 : d <= 15;
                }
                return true;
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
// @desc    Accept Order (Driver)
// @route   POST /api/orders/:id/accept
const acceptOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        const driverId = req.user.id;

        console.log(`[RACE_DEBUG] Driver ${driverId} attempting to accept Order ${orderId}`);

        // 1. Initial State Check (Optional, for debugging)
        const initialCheck = await Order.findById(orderId);
        if (!initialCheck) {
            console.log(`[RACE_DEBUG] Order ${orderId} NOT FOUND`);
            return res.status(404).json({ message: "Order not found" });
        }
        console.log(`[RACE_DEBUG] Order ${orderId} current driver: ${initialCheck.driver}`);

        if (initialCheck.driver) {
            console.log(`[RACE_DEBUG] REJECTING: Order ${orderId} already has driver ${initialCheck.driver}`);
            return res.status(400).json({
                message: "Order already accepted by another driver",
                code: "ORDER_ALREADY_TAKEN",
                currentDriver: initialCheck.driver
            });
        }

        // 2. Atomic Update
        // Use atomic findOneAndUpdate to prevent race conditions
        // This ensures only ONE driver can accept the order
        const order = await Order.findOneAndUpdate(
            {
                _id: orderId,
                driver: null  // CRITICAL: Only update if driver is null
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

        // 3. Post-Update Verification
        if (!order) {
            // If order is null, it means the query { _id: orderId, driver: null } failed to find a match.
            // Since we know the order exists (from initialCheck), it means 'driver' was NOT null.
            console.log(`[RACE_DEBUG] FAILED: Driver ${driverId} failed to acquire lock on Order ${orderId}`);

            // Fetch checks to see who got it
            const finalCheck = await Order.findById(orderId);
            console.log(`[RACE_DEBUG] Order ${orderId} was taken by Driver ${finalCheck?.driver}`);

            return res.status(400).json({
                message: "Order already accepted by another driver",
                code: "ORDER_ALREADY_TAKEN"
            });
        }

        console.log(`[RACE_DEBUG] SUCCESS: Driver ${driverId} successfully accepted Order ${orderId}`);

        const updatedOrder = await Order.findById(orderId)
            .populate("restaurant")
            .populate("driver");

        // Emit Events
        const io = req.app.get('io');
        if (io) {
            // Notify User (if they are in a room, or we broadcast)
            io.emit(`order_${orderId}`, updatedOrder);

            // Remove from other drivers' lists
            console.log(`[RACE_DEBUG] Emitting orderTaken for ${orderId}`);
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

// @desc    Cancel Order (User)
// @route   PUT /api/orders/:id/cancel
const cancelOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        const userId = req.user._id;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // 1. Verify Ownership
        if (order.user.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Not authorized to cancel this order" });
        }

        // 2. Verify Status (Only "Order Placed" can be cancelled)
        if (order.status !== "Order Placed") {
            return res.status(400).json({
                message: `Cannot cancel order in ${order.status} status. It may already be confirmed or prepared.`,
                status: order.status
            });
        }

        // 3. Perform Cancellation
        order.status = "Cancelled";
        order.timeline.push({
            status: "Cancelled",
            time: new Date(),
            description: "Order has been cancelled by the user"
        });

        await order.save();

        const populatedOrder = await Order.findById(orderId)
            .populate("restaurant", "name image address")
            .populate("driver", "name phone vehicleNumber image");

        // Notify Driver if assigned (though for "Order Placed" it's usually null)
        const io = req.app.get('io');
        if (io) {
            // Notify other drivers to remove from their available list
            io.emit('orderCancelled', orderId);
            // Notify status room
            io.emit(`order_${orderId}`, populatedOrder);
        }

        res.json({
            message: "Order cancelled successfully",
            order: populatedOrder
        });

    } catch (error) {
        console.error("Cancel Order Error:", error);
        res.status(500).json({ message: "Failed to cancel order" });
    }
}

module.exports = {
    createOrder,
    getUserOrders,
    getAvailableOrders,
    acceptOrder,
    updateOrderStatus,
    getDriverActiveOrder,
    getDriverHistory,
    cancelOrder
};
