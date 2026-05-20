const express = require('express');
const router = express.Router();
const { placeOrder, getMyOrders, getOrderById, trackOrder } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

router.post('/place', (req, res, next) => {
    // Optional protect: if token exists, decode it, else continue as guest
    if (req.headers.authorization) {
        return protect(req, res, next);
    }
    next();
}, placeOrder);

router.get('/my-orders', protect, getMyOrders);
router.get('/:id', protect, getOrderById);
router.get('/track/:order_number', trackOrder);

module.exports = router;
