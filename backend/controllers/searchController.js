const pool = require('../config/db');

// @desc    Global search across products, orders, and users
// @route   GET /api/admin/global-search
// @access  Admin
const globalSearch = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || query.length < 2) {
            return res.json({ products: [], orders: [], users: [] });
        }

        const searchTerm = `%${query}%`;

        // Search Products
        const [products] = await pool.query(
            'SELECT id, name, image, selling_price as price FROM products WHERE name LIKE ? OR description LIKE ? LIMIT 5',
            [searchTerm, searchTerm]
        );

        // Search Orders
        const [orders] = await pool.query(
            'SELECT id, order_number, customer_name, total_amount, order_status FROM orders WHERE order_number LIKE ? OR customer_name LIKE ? OR customer_mobile LIKE ? LIMIT 5',
            [searchTerm, searchTerm, searchTerm]
        );

        // Search Users
        const [users] = await pool.query(
            'SELECT id, name, email, mobile FROM users WHERE name LIKE ? OR email LIKE ? OR mobile LIKE ? LIMIT 5',
            [searchTerm, searchTerm, searchTerm]
        );

        res.json({ products, orders, users });
    } catch (error) {
        console.error('Global Search Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { globalSearch };
