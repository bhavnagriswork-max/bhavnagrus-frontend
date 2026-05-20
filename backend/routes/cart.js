const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/authMiddleware');

router.get('/', auth, async (req, res) => {
    try {
        const [cartItems] = await db.query(
            'SELECT c.id, c.quantity, p.id as product_id, p.name, p.price, p.image FROM cart c JOIN products p ON c.product_id = p.id WHERE c.user_id = ?',
            [req.user.id]
        );
        res.json(cartItems);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.post('/add', auth, async (req, res) => {
    const { product_id, quantity } = req.body;
    try {
        const [existing] = await db.query('SELECT * FROM cart WHERE user_id = ? AND product_id = ?', [req.user.id, product_id]);
        if (existing.length > 0) {
            await db.query('UPDATE cart SET quantity = quantity + ? WHERE id = ?', [quantity || 1, existing[0].id]);
        } else {
            await db.query('INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)', [req.user.id, product_id, quantity || 1]);
        }
        res.json({ message: 'Product added to cart' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.delete('/remove/:id', auth, async (req, res) => {
    try {
        await db.query('DELETE FROM cart WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        res.json({ message: 'Item removed from cart' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;
