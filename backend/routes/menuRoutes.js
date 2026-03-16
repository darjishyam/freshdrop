const express = require('express');
const router = express.Router();
const { getMenu, getMenuItemById, addMenuItem, toggleStock, deleteMenuItem, updateMenuItem } = require('../controllers/menuController');
const { protect } = require('../middleware/restaurantAuthMiddleware');

const upload = require('../middleware/uploadMiddleware');

router.get('/:restaurantId', protect, getMenu);
router.get('/restaurant-item/:id', protect, getMenuItemById);
router.post('/', protect, upload.single('image'), addMenuItem);
router.put('/:id/toggle', protect, toggleStock);
router.put('/:id', protect, upload.single('image'), updateMenuItem);
router.delete('/:id', protect, deleteMenuItem);

module.exports = router;
