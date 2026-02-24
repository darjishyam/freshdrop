const express = require('express');
const router = express.Router();
const { getMenu, addMenuItem, toggleStock, deleteMenuItem } = require('../controllers/menuController');

router.get('/:restaurantId', getMenu);
router.post('/', addMenuItem);
router.put('/:id/toggle', toggleStock);
router.delete('/:id', deleteMenuItem);

module.exports = router;
