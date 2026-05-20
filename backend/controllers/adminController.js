const pool = require('../config/db');

const getDashboardStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let dateFilter = '';
        let params = [];

        if (startDate && endDate) {
            dateFilter = ' AND created_at BETWEEN ? AND ?';
            params = [startDate + ' 00:00:00', endDate + ' 23:59:59'];
        }

        const [[{ totalProducts }]] = await pool.query('SELECT COUNT(*) as totalProducts FROM products');
        const [[{ totalOrders }]] = await pool.query('SELECT COUNT(*) as totalOrders FROM orders WHERE 1=1' + dateFilter, params);
        const [[{ pendingOrders }]] = await pool.query('SELECT COUNT(*) as pendingOrders FROM orders WHERE order_status = "Pending"' + dateFilter, params);
        const [[{ totalRevenue }]] = await pool.query('SELECT COALESCE(SUM(total_amount),0) as totalRevenue FROM orders WHERE payment_status = "Paid"' + dateFilter, params);
        const [[{ totalCustomers }]] = await pool.query('SELECT COUNT(*) as totalCustomers FROM users WHERE role = "user"');
        const [[{ deliveredOrders }]] = await pool.query('SELECT COUNT(*) as deliveredOrders FROM orders WHERE order_status = "Delivered"' + dateFilter, params);
        const [[{ cancelledOrders }]] = await pool.query('SELECT COUNT(*) as cancelledOrders FROM orders WHERE order_status = "Cancelled"' + dateFilter, params);
        const [[{ processingOrders }]] = await pool.query('SELECT COUNT(*) as processingOrders FROM orders WHERE order_status IN ("Processing","Shipped")' + dateFilter, params);

        // Today's stats
        const [[{ todayOrders }]] = await pool.query('SELECT COUNT(*) as todayOrders FROM orders WHERE DATE(created_at) = CURDATE()');
        const [[{ todayRevenue }]] = await pool.query('SELECT COALESCE(SUM(total_amount),0) as todayRevenue FROM orders WHERE DATE(created_at) = CURDATE()');
        
        // This month
        const [[{ monthRevenue }]] = await pool.query('SELECT COALESCE(SUM(total_amount),0) as monthRevenue FROM orders WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())');
        const [[{ monthOrders }]] = await pool.query('SELECT COUNT(*) as monthOrders FROM orders WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())');

        // Payment breakdown
        const [[{ codOrders }]] = await pool.query('SELECT COUNT(*) as codOrders FROM orders WHERE payment_method = "COD"' + dateFilter, params);
        const [[{ onlineOrders }]] = await pool.query('SELECT COUNT(*) as onlineOrders FROM orders WHERE payment_method != "COD"' + dateFilter, params);

        // Top selling products (Filtered by date)
        const [topProducts] = await pool.query(`
            SELECT p.name, p.image, SUM(oi.quantity) as total_sold, SUM(oi.quantity * oi.product_price) as revenue
            FROM order_items oi 
            JOIN products p ON oi.product_id = p.id 
            JOIN orders o ON oi.order_id = o.id
            WHERE 1=1 ${dateFilter.replace('created_at', 'o.created_at')}
            GROUP BY oi.product_id 
            ORDER BY total_sold DESC LIMIT 5
        `, params);

        // Recent orders with item images
        const [recentOrders] = await pool.query(`
            SELECT o.id, o.order_number, o.customer_name, o.total_amount, o.order_status, o.payment_method, o.payment_status, o.created_at,
                   (SELECT p.image FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = o.id LIMIT 1) as product_image
            FROM orders o 
            WHERE 1=1 ${dateFilter}
            ORDER BY o.created_at DESC LIMIT 8
        `, params);

        // Weekly/Filter range activity
        const [weeklyData] = await pool.query(`
            SELECT DATE(created_at) as date, COUNT(*) as count, COALESCE(SUM(total_amount),0) as revenue
            FROM orders 
            WHERE 1=1 ${dateFilter || ' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)'}
            GROUP BY DATE(created_at) 
            ORDER BY date ASC
        `, params);

        res.json({
            totalProducts, totalOrders, pendingOrders, totalRevenue: totalRevenue || 0,
            totalCustomers, deliveredOrders, cancelledOrders, processingOrders,
            todayOrders, todayRevenue: todayRevenue || 0,
            monthRevenue: monthRevenue || 0, monthOrders,
            codOrders, onlineOrders,
            topProducts, recentOrders, weeklyData
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAllOrders = async (req, res) => {
    try {
        // Fetch orders basic info first
        const [orders] = await pool.query(`
            SELECT o.*, 
                   (SELECT GROUP_CONCAT(p.image) FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = o.id) as item_images
            FROM orders o 
            ORDER BY o.created_at DESC
        `);

        // Fetch all items for these orders to avoid JSON_ARRAYAGG compatibility issues
        if (orders.length > 0) {
            const orderIds = orders.map(o => o.id);
            const [items] = await pool.query(`
                SELECT oi.*, p.name as product_name
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id IN (?)
            `, [orderIds]);

            // Group items by order_id
            orders.forEach(order => {
                order.items = items.filter(item => item.order_id === order.id);
            });
        }

        res.json(orders);
    } catch (error) {
        console.error('Fetch Orders Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const { sendStatusUpdateEmail } = require('../utils/email');

const updateOrderStatus = async (req, res) => {
    try {
        const { status, note } = req.body;
        const order_id = req.params.id;

        // Fetch order number to send email
        const [orders] = await pool.query('SELECT order_number FROM orders WHERE id = ?', [order_id]);
        if (orders.length === 0) return res.status(404).json({ message: 'Order not found' });
        
        const orderNumber = orders[0].order_number;

        await pool.query('UPDATE orders SET order_status = ? WHERE id = ?', [status, order_id]);
        
        if (note) {
            await pool.query('UPDATE orders SET tracking_note = ? WHERE id = ?', [note, order_id]);
        }

        await pool.query('INSERT INTO order_status_history (order_id, status, note) VALUES (?, ?, ?)', [order_id, status, note || 'Status updated by admin']);
        
        // Trigger status update email
        sendStatusUpdateEmail(orderNumber, status, note).catch(console.error);

        res.json({ message: 'Order status updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updatePaymentStatus = async (req, res) => {
    try {
        const { payment_status } = req.body;
        await pool.query('UPDATE orders SET payment_status = ? WHERE id = ?', [payment_status, req.params.id]);
        res.json({ message: 'Payment status updated' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const getSettings = async (req, res) => {
    try {
        const [settings] = await pool.query('SELECT * FROM settings');
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const updateSettings = async (req, res) => {
    try {
        const settings = req.body; // array of { setting_key, setting_value }
        for (let setting of settings) {
            await pool.query('UPDATE settings SET setting_value = ? WHERE setting_key = ?', [setting.setting_value, setting.setting_key]);
        }
        res.json({ message: 'Settings updated' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const [users] = await pool.query(`
            SELECT u.id, u.name, u.email, u.mobile, u.role, u.status, u.created_at, u.last_login,
                   (SELECT MAX(created_at) FROM site_visitors WHERE user_id = u.id) as last_visited
            FROM users u 
            ORDER BY u.created_at DESC
        `);
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const bcrypt = require('bcryptjs');

const resetUserPassword = async (req, res) => {
    try {
        const { userId, newPassword } = req.body;
        if (!newPassword) return res.status(400).json({ message: 'New password is required' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
        res.json({ message: `Password reset successfully` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteOrder = async (req, res) => {
    try {
        const order_id = req.params.id;
        await pool.query('DELETE FROM orders WHERE id = ?', [order_id]);
        res.json({ message: 'Order deaccessioned from archives' });
    } catch (error) {
        console.error('Delete Order Error:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

const bulkDeleteOrders = async (req, res) => {
    try {
        const { orderIds } = req.body;
        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            return res.status(400).json({ message: 'No orders selected for deaccession' });
        }

        await pool.query('DELETE FROM orders WHERE id IN (?)', [orderIds]);
        res.json({ message: `${orderIds.length} records successfully deaccessioned` });
    } catch (error) {
        console.error('Bulk Delete Error:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

const getAiSuggestions = async (req, res) => {
    try {
        // 1. Get Best Sellers
        const [topProducts] = await pool.query(`
            SELECT p.name, p.selling_price, p.weight, SUM(oi.quantity) as total_sold
            FROM order_items oi 
            JOIN products p ON oi.product_id = p.id 
            GROUP BY oi.product_id 
            ORDER BY total_sold DESC LIMIT 3
        `);

        // 2. Get Underperforming/New Products
        const [recentProducts] = await pool.query(`
            SELECT name, selling_price FROM products 
            WHERE id NOT IN (SELECT product_id FROM order_items)
            ORDER BY created_at DESC LIMIT 2
        `);

        // 3. Generate Simulated AI Logic
        const suggestions = [];

        if (topProducts.length > 0) {
            const best = topProducts[0];
            suggestions.push({
                type: 'BEST_SELLER',
                title: `Leverage the popularity of ${best.name}`,
                content: `This product has moved ${best.total_sold} units recently. Consider a "Heritage Favorite" campaign focusing on its traditional roots.`,
                adCopy: `Experience the taste that has defined Bhavnagar for generations. Our ${best.name} is back in stock and ready for your royal table. Order now for authentic flavor.`
            });
        }

        if (recentProducts.length > 0) {
            const fresh = recentProducts[0];
            suggestions.push({
                type: 'MARKET_ENTRY',
                title: `Launch campaign for ${fresh.name}`,
                content: `This item is new to the collection. A limited-time introductory offer could drive initial interest.`,
                adCopy: `A New Chapter in Heritage. Introducing the ${fresh.name} – crafted with the same royal precision you expect from Bhavnagris. Be the first to taste tradition reborn.`
            });
        }

        // Add a general strategy
        suggestions.push({
            type: 'STRATEGY',
            title: 'Visual Excellence Boost',
            content: 'High-performing snacks often see a 25% conversion lift when paired with heritage-themed storytelling videos.',
            adCopy: 'From our kitchen to your home – watch the art of authentic snacking. [Insert Link to Heritage Video]'
        });

        res.json({
            status: 'AI_OPTIMIZED',
            timestamp: new Date(),
            suggestions
        });
    } catch (error) {
        console.error('AI Suggestion Error:', error);
        res.status(500).json({ message: 'AI Analysis Failed' });
    }
};

module.exports = {
    getDashboardStats, getAllOrders, updateOrderStatus, updatePaymentStatus, getSettings, updateSettings, getAllUsers, resetUserPassword,
    deleteOrder, bulkDeleteOrders, getAiSuggestions
};
