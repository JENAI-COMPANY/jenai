const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateQuantity, removeFromCart, clearCart } = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getCart);
router.post('/add', protect, addToCart);
router.put('/update', protect, updateQuantity);
router.delete('/remove', protect, removeFromCart);
router.delete('/clear', protect, clearCart);

module.exports = router;
