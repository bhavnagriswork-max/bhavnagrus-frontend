const pool = require('../config/db');
const { sendOrderEmail } = require('../utils/email');

const placeOrder = async (req, res) => {
    try {
        const user_id = req.user ? req.user.id : null;
        const { 
            customer_name, customer_email, customer_mobile, 
            address_line1, address_line2, city, state, pincode, landmark,
            subtotal, delivery_charge, discount_amount, total_amount, payment_method,
            items
        } = req.body;

        // Generate Order Number
        const order_number = 'ORD' + Date.now() + Math.floor(Math.random() * 1000);

        // Insert Order
        const [orderResult] = await pool.query(
            `INSERT INTO orders 
            (order_number, user_id, customer_name, customer_email, customer_mobile, address_line1, address_line2, city, state, pincode, landmark, subtotal, delivery_charge, discount_amount, total_amount, payment_method) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [order_number, user_id, customer_name, customer_email, customer_mobile, address_line1, address_line2, city, state, pincode, landmark, subtotal, delivery_charge, discount_amount, total_amount, payment_method]
        );
        const order_id = orderResult.insertId;

        // Determine final items
        let finalItems = [];
        if (user_id) {
            const [dbCartItems] = await pool.query(`
                SELECT c.product_id, c.quantity, p.name, p.selling_price, p.weight 
                FROM carts c JOIN products p ON c.product_id = p.id WHERE c.user_id = ?
            `, [user_id]);
            finalItems = dbCartItems;
        } else {
            finalItems = items;
        }

        if (!finalItems || finalItems.length === 0) {
            return res.status(400).json({ message: 'No items provided for order' });
        }

        // Insert Order Items and Update Stock
        for (let item of finalItems) {
            const itemTotal = item.selling_price * item.quantity;
            await pool.query(
                `INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, weight, total_price) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [order_id, item.product_id, item.name, item.selling_price, item.quantity, item.weight, itemTotal]
            );

            // Reduce Stock
            await pool.query('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?', [item.quantity, item.product_id]);
        }

        // Clear Cart only if user is logged in
        if (user_id) {
            await pool.query('DELETE FROM carts WHERE user_id = ?', [user_id]);
        }

        // Insert Status History
        await pool.query("INSERT INTO order_status_history (order_id, status, note) VALUES (?, 'Pending', 'Order placed successfully')", [order_id]);

        // --- Send Email Notification ---
        const [settings] = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'admin_order_email'");
        const adminEmail = settings.length > 0 ? settings[0].setting_value : 'harshmn0@gmail.com';

        sendOrderEmail({ 
            order_number, customer_name, customer_email, customer_mobile, total_amount, address_line1, city 
        }, finalItems, adminEmail).catch(console.error);

        res.status(201).json({ message: 'Order placed successfully', order_number });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message, stack: error.stack });
    }
};

const getMyOrders = async (req, res) => {
    try {
        const [orders] = await pool.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const getOrderById = async (req, res) => {
    try {
        const [orders] = await pool.query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        if (orders.length === 0) return res.status(404).json({ message: 'Order not found' });

        const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);
        
        res.json({ order: orders[0], items });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const trackOrder = async (req, res) => {
    try {
        const [orders] = await pool.query('SELECT * FROM orders WHERE order_number = ?', [req.params.order_number]);
        if (orders.length === 0) return res.status(404).json({ message: 'Order not found' });

        const [history] = await pool.query('SELECT * FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC', [orders[0].id]);
        
        res.json({ order: orders[0], history });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    placeOrder, getMyOrders, getOrderById, trackOrder
};
