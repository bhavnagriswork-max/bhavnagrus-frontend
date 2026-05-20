const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/authMiddleware');

router.post('/', auth, async (req, res) => {
    const { total_price, items } = req.body; // items: [{product_id, quantity, price}]
    try {
        const [orderResult] = await db.query('INSERT INTO orders (user_id, total_price) VALUES (?, ?)', [req.user.id, total_price]);
        const orderId = orderResult.insertId;

        const values = items.map(item => [orderId, item.product_id, item.quantity, item.price]);
        await db.query('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?', [values]);

        // Clear user cart after order
        await db.query('DELETE FROM cart WHERE user_id = ?', [req.user.id]);

        res.json({ message: 'Order placed successfully', orderId });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.get('/', auth, async (req, res) => {
    try {
        let query = 'SELECT * FROM orders WHERE user_id = ?';
        let params = [req.user.id];
        
        if (req.user.role === 'admin') {
            query = 'SELECT * FROM orders';
            params = [];
        }

        const [orders] = await db.query(query, params);
        res.json(orders);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.get('/:id', auth, async (req, res) => {
    try {
        const [order] = await db.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
        if (order.length === 0) return res.status(404).json({ message: 'Order not found' });
        
        if (req.user.role !== 'admin' && order[0].user_id !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const [items] = await db.query(
            'SELECT oi.*, p.name, p.image FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?', 
            [req.params.id]
        );

        res.json({ order: order[0], items });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;
