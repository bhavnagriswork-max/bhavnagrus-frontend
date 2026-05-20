const express = require('express');
const router = express.Router();
const { createRazorpayOrder, verifyRazorpayPayment, getPaymentConfig } = require('../controllers/paymentController');

router.get('/config', getPaymentConfig);
router.post('/create-order', createRazorpayOrder);
router.post('/verify', verifyRazorpayPayment);

module.exports = router;
