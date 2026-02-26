const Product = require('../models/Product');
const Restaurant = require('../models/Restaurant');
const Grocery = require('../models/Grocery');

// @desc    Get all menu items for a restaurant
// @route   GET /api/menu/:restaurantId
const getMenu = async (req, res) => {
    try {
        const items = await Product.find({ restaurant: req.params.restaurantId });
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add a menu item
// @route   POST /api/menu
const addMenuItem = async (req, res) => {
    const {
        restaurantId, name, price, category, isVeg,
        description, image, isBestSeller, isMustTry,
        quantityDetails, brandName, weight, unit, stockQuantity
    } = req.body;

    try {
        console.log("Adding item for merchant:", restaurantId);

        let merchantType = 'Restaurant';
        let merchant = await Restaurant.findById(restaurantId);
        if (!merchant) {
            merchant = await Grocery.findById(restaurantId);
            merchantType = 'Grocery';
        }

        if (!merchant) {
            return res.status(404).json({ message: "Merchant not found" });
        }

        const item = await Product.create({
            merchantType: merchantType,
            restaurant: restaurantId,
            name,
            price,
            category,
            isVeg,
            description,
            image,
            isBestSeller,
            isMustTry,
            quantityDetails,
            brandName,
            weight,
            unit,
            stockQuantity
        });
        console.log("Item added:", item._id);
        res.status(201).json(item);
    } catch (error) {
        console.error("Error adding item:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle stock status
// @route   PUT /api/menu/:id/toggle
const toggleStock = async (req, res) => {
    try {
        const item = await Product.findById(req.params.id);
        if (item) {
            item.inStock = !item.inStock;
            await item.save();

            // 🔴 Emit real-time update to all connected User App clients
            const io = req.app.get("io");
            if (io) {
                io.emit('stockUpdate', {
                    itemId: item._id.toString(),
                    restaurantId: item.restaurant.toString(),
                    inStock: item.inStock,
                });
                console.log(`📡 stockUpdate emitted: item=${item.name}, inStock=${item.inStock}`);
            }

            res.json(item);
        } else {
            res.status(404).json({ message: 'Item not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a menu item
// @route   DELETE /api/menu/:id
const deleteMenuItem = async (req, res) => {
    try {
        const item = await Product.findByIdAndDelete(req.params.id);
        if (item) {
            res.json({ message: 'Item deleted successfully' });
        } else {
            res.status(404).json({ message: 'Item not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getMenu,
    addMenuItem,
    toggleStock,
    deleteMenuItem
};
