const express = require('express');
const router = express.Router();
const { getMenu, getMenuItemById, addMenuItem, toggleStock, deleteMenuItem, updateMenuItem } = require('../controllers/menuController');
const { protect } = require('../middleware/restaurantAuthMiddleware');

router.get('/:restaurantId', protect, getMenu);
router.get('/restaurant-item/:id', protect, getMenuItemById);
router.post('/', protect, addMenuItem);
router.put('/:id/toggle', protect, toggleStock);
router.put('/:id', protect, updateMenuItem);
router.delete('/:id', protect, deleteMenuItem);

module.exports = router;
