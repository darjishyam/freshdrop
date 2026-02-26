const fs = require("fs");
const path = require("path");
const Order = require("../models/Order");
const User = require("../models/User");
const Driver = require("../models/Driver");
const Restaurant = require("../models/Restaurant");
const Grocery = require("../models/Grocery");
const { sendPushNotification } = require("../services/notificationService");

const logFile = path.join(__dirname, "../logs/order_dispatch.log");
// Ensure logs directory exists
if (!fs.existsSync(path.dirname(logFile))) {
    fs.mkdirSync(path.dirname(logFile), { recursive: true });
}

// @desc    Place a new order
// @route   POST /api/orders
let _orderReqCount = 0;
const createOrder = async (req, res) => {
    _orderReqCount++;
    const reqNum = _orderReqCount;
    const timestamp = new Date().toISOString();

    try {
        const {
            restaurantId,
            items,
            totalAmount,
            deliveryAddress,
            paymentMethod,
        } = req.body;

        // Log ALL incoming order requests with a counter to distinguish duplicates
        const logLine = `[${timestamp}] [ORDER #${reqNum}] restaurantId="${restaurantId}" type=${typeof restaurantId} len=${restaurantId?.length} items=${items?.length} user=${req.user?._id}\n`;
        console.log(logLine.trim());
        fs.appendFileSync(logFile, logLine);

        // FINAL SAFETY CHECK: Ensure user is not suspended
        if (req.user && req.user.status === "SUSPENDED") {
            return res.status(403).json({ message: "Your account is suspended. Order failed." });
        }

        if (!items || items.length === 0) {
            return res.status(400).json({ message: "No order items" });
        }

        // Try finding in Restaurant collection
        let restaurant = await Restaurant.findById(restaurantId);
        let merchantType = 'Restaurant';

        if (!restaurant) {
            // Try finding in Grocery collection
            restaurant = await Grocery.findById(restaurantId);
            merchantType = 'Grocery';
        }

        if (!restaurant) {
            const errLine = `[${timestamp}] [ORDER #${reqNum}] ❌ NOT FOUND: restaurantId="${restaurantId}"\n`;
            console.log(errLine.trim());
            fs.appendFileSync(logFile, errLine);
            return res.status(404).json({ message: "Restaurant or Grocery Store not found" });
        }
        const okLine = `[${timestamp}] [ORDER #${reqNum}] ✅ Found ${merchantType}: ${restaurant.name}\n`;
        console.log(okLine.trim());
        fs.appendFileSync(logFile, okLine);

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
            merchantType: merchantType,
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
        const populatedOrder = await Order.findById(createdOrder._id)
            .populate("restaurant", "name image address")
            .populate("user", "name phone address");

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
        } // Close if (restaurant.address...)

        // Find Nearby Drivers (Logic Moved to updateRestaurantOrderStatus on Ready)
        // Order is now silent until marked Ready by restaurant
        console.log(`[ORDER_CREATE] Order ${createdOrder._id} placed. Waiting for restaurant to Mark Ready.`);

        // --- NEW: Notify Restaurant (Real-Time & Push) ---
        const io = req.app.get('io');
        if (io) {
            const restaurantRoom = `restaurant_${restaurantId}`;
            io.to(restaurantRoom).emit('restaurantNewOrder', populatedOrder);
            io.to("admin_room").emit('adminNewOrder', populatedOrder); // NOTIFY ADMIN
            console.log(`📡 Emitted 'restaurantNewOrder' to ${restaurantRoom} and 'adminNewOrder' to admin_room`);
        }

        // Fetch Restaurant details for Push Token
        // Fetch Merchant details for Push Token
        try {
            let restaurantDoc = await Restaurant.findById(restaurantId);
            if (!restaurantDoc) restaurantDoc = await Grocery.findById(restaurantId);

            if (restaurantDoc && restaurantDoc.pushToken) {
                console.log(`[PUSH] Notifying Restaurant: ${restaurantDoc.name}`);
                await sendPushNotification(
                    [restaurantDoc.pushToken],
                    "🍔 New Order Received",
                    `${itemCount} items • Tap to review and accept`,
                    { orderId: createdOrder._id, type: 'NEW_ORDER', restaurantId: restaurantId }
                );
                console.log(`[PUSH] Restaurant notification sent.`);
            }

            if (req.user.pushToken) {
                console.log(`[PUSH] Notifying User of success: ${req.user.email}`);
                await sendPushNotification(
                    [{ userId: req.user._id, pushToken: req.user.pushToken }],
                    "✅ Order placed successfully",
                    "We’re confirming your order with the restaurant.",
                    { type: 'ORDER_PLACED', orderId: createdOrder._id },
                    'User'
                );
                console.log(`[PUSH] User success notification sent.`);
            }
        } catch (pushError) {
            console.error("Failed to send push notifications:", pushError);
        }
        // ------------------------------------------

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
            status: { $in: ["Ready"] }, // STRICT: Only show Ready orders
            driver: null,
            createdAt: { $gt: threeHoursAgo }
        };

        const orders = await Order.find(query)
            .sort({ createdAt: -1 }) // Newest First
            .populate("restaurant", "name address storeType");

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

            // NEW LOGIC: Only strictly filter out if they are different cities AND coordinates ARE NOT being used.
            // If coordinates exist, we'll let the distance check handle the filtering later.
            if (latitude && longitude && order.restaurant?.address?.coordinates) {
                return true; // Pass to GPS check
            }

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
        try {
            const fs = require('fs');
            const path = require('path');
            const logFile = path.join(__dirname, "../logs/order_dispatch.log");
            fs.appendFileSync(logFile, `[ERROR getAvailableOrders] ${error.message}\n${error.stack}\n`);
        } catch (e) { }
        res.status(500).json({ message: "Failed to fetch orders" });
    }
}

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
        // NOTE: We DO NOT change status to "Confirmed". It stays "Ready" (or whatever it was).
        const order = await Order.findOneAndUpdate(
            {
                _id: orderId,
                driver: null  // CRITICAL: Only update if driver is null
            },
            {
                $set: {
                    driver: driverId,
                    // status: "Confirmed", // REMOVED: Keep existing status (expected "Ready")
                    driverDetails: {
                        name: req.user.name,
                        phone: req.user.phone,
                        vehicleNumber: req.user.vehicleNumber,
                        image: req.user.profilePhoto
                    }
                },
                $push: {
                    timeline: {
                        status: "Ready", // Assume Ready since we filter for Ready
                        time: new Date(),
                        description: `${req.user.name} has accepted your order (FIXED)`
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

            // --- NEW: User Notification (DRIVER_ASSIGNED) ---
            try {
                const userDoc = await User.findById(updatedOrder.user);
                if (userDoc && userDoc.pushToken) {
                    const driverFirstName = req.user.name ? req.user.name.split(' ')[0] : 'Delivery partner';
                    console.log(`[PUSH] Notifying User of Driver Assignment: ${userDoc.email}`);
                    await sendPushNotification(
                        [{ userId: userDoc._id, pushToken: userDoc.pushToken }],
                        "🚚 Delivery partner assigned",
                        `${driverFirstName} is on the way to pick up your order.`,
                        { type: 'DRIVER_ASSIGNED', orderId: orderId },
                        'User'
                    );
                    console.log(`[PUSH] User assignment notification sent.`);
                }
            } catch (uPushErr) {
                console.log("User push notification (Driver Assigned) err:", uPushErr.message);
            }

            // Notify Admin
            io.to("admin_room").emit('adminOrderUpdate', updatedOrder);

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

            // --- NEW: User Push Notification ---
            try {
                const userDoc = await User.findById(updatedOrder.user);
                if (userDoc && userDoc.pushToken) {
                    let title = "Order Update";
                    let body = `Your order status is now: ${status}`;

                    if (status === 'Out for Delivery') {
                        title = "🛵 Your delivery partner is on the way";
                        body = `Arriving soon! Your order from ${updatedOrder.restaurant?.name || 'the restaurant'} has been picked up.`;
                    } else if (status === 'Delivered') {
                        title = "🍔 Enjoy your meal!";
                        body = `Your order from ${updatedOrder.restaurant?.name || 'the restaurant'} has been delivered. Bon appétit!`;
                    }

                    console.log(`[PUSH] Identified User: ${userDoc.email || userDoc.phone}, Token: ${userDoc.pushToken ? 'YES' : 'NO'}`);
                    await sendPushNotification(
                        [{ userId: userDoc._id, pushToken: userDoc.pushToken }],
                        title,
                        body,
                        { type: 'ORDER_UPDATE', orderId: orderId },
                        'User'
                    );
                    console.log(`[PUSH] Order Update notification sent to user for status: ${status}`);
                } else {
                    console.log(`[PUSH] Skip: User doc not found or missing token for ID: ${updatedOrder.user}`);
                }
            } catch (uPushErr) {
                console.log("User push notification err:", uPushErr.message);
            }

            // NOTIFY ADMIN
            io.to("admin_room").emit('adminOrderUpdate', updatedOrder);
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
            .populate("restaurant", "name address storeType")
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
            // NOTIFY ADMIN
            io.to("admin_room").emit('adminOrderUpdate', populatedOrder);
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




// @desc    Get Active Orders for Restaurant
// @route   GET /api/orders/restaurant/:id/active
const getRestaurantActiveOrders = async (req, res) => {
    try {
        const restaurantId = req.params.id;
        let orders = await Order.find({
            restaurant: restaurantId,
            status: { $nin: ["Delivered", "Cancelled"] }
        }).sort({ createdAt: -1 }).populate("user", "name phone address");
        res.json(orders);
    } catch (error) {
        console.error("Fetch Restaurant Active Orders Error:", error);
        res.status(500).json({ message: "Failed to fetch active orders" });
    }
};

// @desc    Update Order Status (Restaurant)
// @route   PUT /api/orders/:id/restaurant-status
const updateRestaurantOrderStatus = async (req, res) => {
    const fs = require('fs');
    const path = require('path');
    const logPath = path.join(__dirname, '../debug_requests.log');
    const log = (msg) => { try { fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`); } catch (e) { } };

    try {
        log(`REQ: ${req.params.id} -> ${req.body.status}`);
        const { status, prepTime } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) { return res.status(404).json({ message: "Order not found" }); }

        order.status = status;
        if (prepTime) order.prepTime = prepTime;
        const lastTimeline = order.timeline[order.timeline.length - 1];
        if (!lastTimeline || lastTimeline.status !== status) {
            order.timeline.push({
                status,
                time: new Date(),
                description: status === 'Ready' ? 'Your food is ready for pickup' : `Order is ${status}`
            });
        }
        await order.save();
        log(`SAVED: ${status}`);

        const io = req.app.get('io');

        if (io) {
            io.emit(`order_${order._id}`, order);
            if (order.user) {
                io.to(`user_${order.user}`).emit('orderStatusUpdate', { orderId: order._id, status: order.status });

                // --- NEW: User Push Notification ---
                try {
                    const userDoc = await User.findById(order.user);
                    const populatedOrder = await Order.findById(order._id).populate("restaurant");
                    if (userDoc && userDoc.pushToken) {
                        let title = "";
                        let body = "";

                        // Mapping Milestone Notifications
                        const resName = populatedOrder.restaurant?.name || 'The restaurant';

                        if (status === 'Confirmed') {
                            title = "🍽️ Order Accepted!";
                            body = `${resName} has accepted your order and is starting preparation.`;
                        } else if (status === 'Preparing') {
                            title = "👨‍🍳 Cooking your food";
                            body = `The chef at ${resName} is now preparing your meal.`;
                        } else if (status === 'Ready') {
                            title = "🥡 Order Ready!";
                            body = `Your delicious food is ready and waiting for a delivery partner.`;
                        } else if (status === 'Cancelled') {
                            title = "❌ Order Cancelled";
                            body = `Sorry, your order at ${resName} was cancelled.`;
                        }

                        if (title) {
                            console.log(`[PUSH] Notifying User of Restaurant Milestone: ${status} -> ${title}`);
                            await sendPushNotification(
                                [{ userId: userDoc._id, pushToken: userDoc.pushToken }],
                                title,
                                body,
                                { type: 'ORDER_UPDATE', orderId: order._id, status: status },
                                'User'
                            );
                            console.log(`[PUSH] Notification sent successfully.`);
                        } else {
                            console.log(`[PUSH] Skip: No notification title mapped for status ${status}`);
                        }
                    } else {
                        console.log(`[PUSH] Skip: User doc not found or missing token for ID: ${order.user}`);
                    }
                } catch (userPushErr) {
                    console.error("Failed to send user push notification:", userPushErr);
                }
            }
            io.emit('orderUpdated', order);
            io.to("admin_room").emit('adminOrderUpdate', order);

            // DRIVER NOTIFICATION (READY only)
            console.log(`[DEBUG] Checking condition: status '${status}' === 'Ready'`);
            if (status === 'Ready') {
                log(`STATUS READY: Notifying Drivers...`);
                console.log(`[DEBUG] Status IS Ready. Proceeding to find drivers...`);

                const populatedOrder = await Order.findById(order._id).populate("restaurant");
                const restaurant = populatedOrder.restaurant; // This will now correctly populate from Groceries if it's a grocery store
                console.log(`[DEBUG] Store found: ${restaurant ? restaurant.name : 'NULL'}`);
                console.log(`[DEBUG] Restaurant Coordinates: ${JSON.stringify(restaurant?.address?.coordinates)}`);

                if (restaurant?.address?.coordinates) {
                    const { lat, lon } = restaurant.address.coordinates;
                    console.log(`[DEBUG] Searching drivers near ${lat}, ${lon}`);

                    let nearbyDrivers = await Driver.find({
                        location: { $near: { $geometry: { type: "Point", coordinates: [lon, lat] }, $maxDistance: 10000 } },
                        isOnline: true, status: { $in: ["ACTIVE", "onboarding", "PENDING"] }
                    });

                    if (nearbyDrivers.length === 0) {
                        log("No drivers found via GeoQuery. Falling back to ALL online drivers.");
                        // console.log("[DEBUG] GeoSearch found 0. Fallback to ALL.");
                        nearbyDrivers = await Driver.find({ isOnline: true, status: { $in: ["ACTIVE", "onboarding", "PENDING"] } });
                    }

                    log(`Found ${nearbyDrivers.length} drivers to notify.`);
                    // console.log(`[DEBUG] Total Drivers Found: ${nearbyDrivers.length}`);

                    // Collect tokens for Push Notification
                    const pushCandidates = nearbyDrivers
                        .filter(d => d.pushToken)
                        .map(d => ({ userId: d._id, pushToken: d.pushToken }));

                    if (pushCandidates.length > 0) {
                        log(`Sending Push to ${pushCandidates.length} drivers`);
                        sendPushNotification(
                            pushCandidates,
                            "🛍️ Pickup Ready!",
                            `Order from ${restaurant?.name || 'Restaurant'} is ready for pickup.`,
                            { type: 'NEW_ORDER', orderId: order._id },
                            'Driver'
                        );
                    }

                    nearbyDrivers.forEach(driver => {
                        log(`Targeting Driver: ${driver._id} (${driver.name})`);
                        // console.log(`[DEBUG] Emitting newOrder to driver_${driver._id}`);
                        io.to(`driver_${driver._id}`).emit('newOrder', populatedOrder);
                        log(`Notified: ${driver._id}`);
                    });
                    // City Room
                    if (restaurant.address.city) {
                        const cityRoom = `city_${restaurant.address.city.toLowerCase().replace(/\s+/g, '_')}`;
                        // console.log(`[DEBUG] Emitting to city room: ${cityRoom}`);
                        io.to(cityRoom).emit('newOrder', populatedOrder);
                    }
                } else {
                    // console.log("[DEBUG] Restaurant has no coordinates!");
                }
            } else {
                // console.log(`[DEBUG] Status is NOT Ready (it is '${status}')`);
                // log(`Status is NOT Ready: ${status}`);
            }
        } else {
            // console.log("[DEBUG] IO Object IS MISSING!");
        }
        res.json(order);
    } catch (error) {
        log(`ERROR: ${error.message}`);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Get Order by ID
// @route   GET /api/orders/:id
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email phone')
            .populate('restaurant', 'name image address')
            .populate('items.product');

        if (order) {
            res.json(order);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createOrder,
    getUserOrders,
    getAvailableOrders,
    acceptOrder,
    updateOrderStatus,
    getDriverActiveOrder,
    getDriverHistory,
    cancelOrder,
    getRestaurantActiveOrders,
    updateRestaurantOrderStatus,
    getOrderById
};
