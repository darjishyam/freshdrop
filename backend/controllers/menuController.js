const Product = require('../models/Product');
const Restaurant = require('../models/Restaurant');
const Grocery = require('../models/Grocery');
const mongoose = require('mongoose');

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
        if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.status(400).json({ message: "Invalid Restaurant ID format" });
        }
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

        let menuItemImage = image;
        if (req.file) {
            menuItemImage = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
        }

        // Cast boolean strings and numbers from FormData
        const castedIsVeg = isVeg === 'true' || isVeg === true;
        const castedIsBestSeller = isBestSeller === 'true' || isBestSeller === true;
        const castedIsMustTry = isMustTry === 'true' || isMustTry === true;
        const castedPrice = parseFloat(price);

        // Parse quantityDetails if it comes as a string from FormData
        let parsedQuantityDetails = quantityDetails;
        if (typeof quantityDetails === 'string') {
            try {
                parsedQuantityDetails = JSON.parse(quantityDetails);
            } catch (e) {
                console.error("Error parsing quantityDetails:", e);
            }
        }

        const item = await Product.create({
            merchantType: merchantType,
            restaurant: restaurantId,
            name,
            price: castedPrice,
            category,
            isVeg: castedIsVeg,
            description,
            image: menuItemImage,
            isBestSeller: castedIsBestSeller,
            isMustTry: castedIsMustTry,
            quantityDetails: parsedQuantityDetails,
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

// @desc    Update a menu item
// @route   PUT /api/menu/:id
const updateMenuItem = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid Item ID format" });
        }

        const updateData = { ...req.body };

        if (req.file) {
            updateData.image = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
        }

        // Cast boolean strings and numbers from FormData for updates
        if (updateData.isVeg !== undefined) updateData.isVeg = updateData.isVeg === 'true' || updateData.isVeg === true;
        if (updateData.isBestSeller !== undefined) updateData.isBestSeller = updateData.isBestSeller === 'true' || updateData.isBestSeller === true;
        if (updateData.isMustTry !== undefined) updateData.isMustTry = updateData.isMustTry === 'true' || updateData.isMustTry === true;
        if (updateData.price !== undefined) updateData.price = parseFloat(updateData.price);

        // Parse quantityDetails if it comes as a string from FormData in updates
        if (updateData.quantityDetails && typeof updateData.quantityDetails === 'string') {
            try {
                updateData.quantityDetails = JSON.parse(updateData.quantityDetails);
            } catch (e) {
                console.error("Error parsing quantityDetails in update:", e);
            }
        }

        const item = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        res.json(item);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get a single menu item by ID
// @route   GET /api/menu/restaurant-item/:id
const getMenuItemById = async (req, res) => {
    try {
        const item = await Product.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.json(item);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getMenu,
    getMenuItemById,
    addMenuItem,
    toggleStock,
    deleteMenuItem,
    updateMenuItem
};
