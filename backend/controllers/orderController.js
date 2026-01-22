const Order = require("../models/Order");

// @desc    Place a new order
// @route   POST /api/orders
// @access  Private
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

        // Calculate bill details
        const itemTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const deliveryFee = itemTotal > 200 ? 0 : 40; // Free delivery above ₹200
        const taxes = Math.round(itemTotal * 0.05); // 5% tax
        const grandTotal = itemTotal + deliveryFee + taxes;

        const order = new Order({
            user: req.user._id,
            restaurant: restaurantId,
            items,
            totalAmount: grandTotal,
            // Bill Details
            billDetails: {
                itemTotal,
                deliveryFee,
                taxes,
                discount: 0,
                grandTotal,
            },
            // Customer Details
            customerDetails: {
                name: req.user.name || "Customer",
                phone: req.user.phone,
                address: deliveryAddress?.street
                    ? `${deliveryAddress.street}, ${deliveryAddress.city}`
                    : "Address not provided",
            },
            // Payment Details
            paymentDetails: {
                method: paymentMethod || "COD",
                status: paymentMethod === "COD" ? "Pending" : "Completed",
                transactionId: paymentMethod !== "COD" ? `TXN${Date.now()}` : null,
            },
            deliveryAddress,
            // Legacy fields for backward compatibility
            paymentMethod,
            paymentStatus: paymentMethod === "COD" ? "Pending" : "Completed",
            status: "Order Placed",
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

        // Populate restaurant details for immediate frontend display
        const populatedOrder = await Order.findById(createdOrder._id).populate(
            "restaurant",
            "name image address"
        );

        res.status(201).json(populatedOrder);
    } catch (error) {
        console.error("Order Create Error:", error);
        res.status(500).json({ message: "Failed to place order" });
    }
};

// @desc    Get logged in user orders
// @route   GET /api/orders
// @access  Private
const getUserOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .populate("restaurant", "name image address");

        // Dynamic Status Updates (Simulation for Demo)
        const ORDER_STAGES = [
            "Order Placed",
            "Confirmed",
            "Preparing",
            "Out for Delivery",
            "Delivered",
        ];
        const STATUS_INTERVAL = 15000; // 15 seconds per stage

        const updatedOrders = await Promise.all(
            orders.map(async (order) => {
                if (order.status === "Delivered") return order;

                const timePassed = Date.now() - new Date(order.createdAt).getTime();
                const stageIndex = Math.floor(timePassed / STATUS_INTERVAL);
                const newStatus =
                    ORDER_STAGES[Math.min(stageIndex, ORDER_STAGES.length - 1)];

                if (newStatus !== order.status) {
                    order.status = newStatus;
                    // Add to timeline if needed (optional for simple demo)
                    await order.save();
                }
                return order;
            })
        );

        res.json(updatedOrders);
    } catch (error) {
        console.error("Fetch Orders Error:", error);
        res.status(500).json({ message: "Failed to fetch orders" });
    }
};

module.exports = {
    createOrder,
    getUserOrders,
};
