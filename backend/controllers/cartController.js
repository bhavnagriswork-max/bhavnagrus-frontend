const pool = require('../config/db');

const getCart = async (req, res) => {
    try {
        const [cartItems] = await pool.query(`
            SELECT c.id, c.product_id, c.quantity, p.name, p.selling_price, p.image, p.weight, p.stock_quantity
            FROM carts c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = ?
        `, [req.user.id]);
        res.json(cartItems);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const addToCart = async (req, res) => {
    try {
        const { product_id, quantity } = req.body;
        const user_id = req.user.id;

        // Check if product exists in cart
        const [existing] = await pool.query('SELECT * FROM carts WHERE user_id = ? AND product_id = ?', [user_id, product_id]);
        
        if (existing.length > 0) {
            // Update quantity
            await pool.query('UPDATE carts SET quantity = quantity + ? WHERE id = ?', [quantity, existing[0].id]);
        } else {
            // Insert new
            await pool.query('INSERT INTO carts (user_id, product_id, quantity) VALUES (?, ?, ?)', [user_id, product_id, quantity]);
        }

        res.status(201).json({ message: 'Added to cart' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const updateCart = async (req, res) => {
    try {
        const { quantity } = req.body;
        await pool.query('UPDATE carts SET quantity = ? WHERE id = ? AND user_id = ?', [quantity, req.params.id, req.user.id]);
        res.json({ message: 'Cart updated' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const removeFromCart = async (req, res) => {
    try {
        await pool.query('DELETE FROM carts WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        res.json({ message: 'Item removed from cart' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const clearCart = async (req, res) => {
    try {
        await pool.query('DELETE FROM carts WHERE user_id = ?', [req.user.id]);
        res.json({ message: 'Cart cleared' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getCart, addToCart, updateCart, removeFromCart, clearCart
};
