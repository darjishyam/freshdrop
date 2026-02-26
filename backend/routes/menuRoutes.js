const express = require('express');
const router = express.Router();
const { getMenu, addMenuItem, toggleStock, deleteMenuItem } = require('../controllers/menuController');
const { protect } = require('../middleware/restaurantAuthMiddleware');

router.get('/:restaurantId', protect, getMenu);
router.post('/', protect, addMenuItem);
router.put('/:id/toggle', protect, toggleStock);
router.delete('/:id', protect, deleteMenuItem);

module.exports = router;
