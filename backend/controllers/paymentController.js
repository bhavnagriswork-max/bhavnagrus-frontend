const pool = require('../config/db');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Get Razorpay keys from DB
async function getRazorpayInstance() {
    const [settings] = await pool.query(
        "SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('razorpay_key_id', 'razorpay_key_secret', 'razorpay_enabled')"
    );
    const config = {};
    settings.forEach(s => config[s.setting_key] = s.setting_value);

    if (config.razorpay_enabled !== 'true' || !config.razorpay_key_id || !config.razorpay_key_secret) {
        return null;
    }

    return {
        instance: new Razorpay({
            key_id: config.razorpay_key_id,
            key_secret: config.razorpay_key_secret
        }),
        key_id: config.razorpay_key_id,
        key_secret: config.razorpay_key_secret
    };
}

// @desc    Create Razorpay order
// @route   POST /api/payment/create-order
const createRazorpayOrder = async (req, res) => {
    try {
        const rz = await getRazorpayInstance();
        if (!rz) return res.status(400).json({ message: 'Payment gateway not configured' });

        const { amount } = req.body;
        const options = {
            amount: Math.round(amount * 100), // Razorpay expects paise
            currency: 'INR',
            receipt: 'order_' + Date.now()
        };

        const order = await rz.instance.orders.create(options);
        res.json({ order_id: order.id, key_id: rz.key_id, amount: order.amount });
    } catch (error) {
        console.error('Razorpay Create Order Error:', error);
        res.status(500).json({ message: 'Failed to create payment order' });
    }
};

// @desc    Verify Razorpay payment
// @route   POST /api/payment/verify
const verifyRazorpayPayment = async (req, res) => {
    try {
        const rz = await getRazorpayInstance();
        if (!rz) return res.status(400).json({ message: 'Payment gateway not configured' });

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const generated_signature = crypto
            .createHmac('sha256', rz.key_secret)
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex');

        if (generated_signature === razorpay_signature) {
            res.json({ verified: true, payment_id: razorpay_payment_id });
        } else {
            res.status(400).json({ verified: false, message: 'Payment verification failed' });
        }
    } catch (error) {
        console.error('Razorpay Verify Error:', error);
        res.status(500).json({ message: 'Payment verification error' });
    }
};

// @desc    Get Razorpay public config (key_id only, for frontend)
// @route   GET /api/payment/config
const getPaymentConfig = async (req, res) => {
    try {
        const [settings] = await pool.query(
            "SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('razorpay_key_id', 'razorpay_enabled')"
        );
        const config = {};
        settings.forEach(s => config[s.setting_key] = s.setting_value);

        res.json({
            razorpay_enabled: config.razorpay_enabled === 'true',
            razorpay_key_id: config.razorpay_enabled === 'true' ? config.razorpay_key_id : null
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { createRazorpayOrder, verifyRazorpayPayment, getPaymentConfig };
