const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateCart, removeFromCart, clearCart } = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getCart);
router.post('/add', protect, addToCart);
router.put('/update/:id', protect, updateCart);
router.delete('/remove/:id', protect, removeFromCart);
router.delete('/clear', protect, clearCart);

module.exports = router;
