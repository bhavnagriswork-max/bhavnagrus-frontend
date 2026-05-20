const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { protect } = require('../middleware/authMiddleware');

// Get all products
router.get('/', async (req, res) => {
    try {
        const [products] = await db.query(`
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id
        `);
        res.json(products);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get featured products
router.get('/featured', async (req, res) => {
    try {
        const [products] = await db.query(`
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.is_featured = 1
            LIMIT 8
        `);
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get product by slug
router.get('/slug/:slug', async (req, res) => {
    try {
        const [products] = await db.query(`
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.slug = ?
        `, [req.params.slug]);
        if (products.length === 0) return res.status(404).json({ message: 'Product not found' });
        res.json(products[0]);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get product by ID
router.get('/:id', async (req, res) => {
    try {
        const [products] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
        if (products.length === 0) return res.status(404).json({ message: 'Product not found' });
        res.json(products[0]);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Admin: Create product
router.post('/', protect, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
    const { name, description, original_price, selling_price, discount_percentage, image, category_id, stock, weight, is_featured, slug } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO products (name, description, original_price, selling_price, discount_percentage, image, category_id, stock, weight, is_featured, slug) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, description, original_price, selling_price, discount_percentage, image, category_id, stock, weight, is_featured, slug]
        );
        res.json({ id: result.insertId, message: 'Product created successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Admin: Update product
router.put('/:id', protect, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
    const { name, description, original_price, selling_price, discount_percentage, image, category_id, stock, weight, is_featured, slug } = req.body;
    try {
        await db.query(
            'UPDATE products SET name = ?, description = ?, original_price = ?, selling_price = ?, discount_percentage = ?, image = ?, category_id = ?, stock = ?, weight = ?, is_featured = ?, slug = ? WHERE id = ?',
            [name, description, original_price, selling_price, discount_percentage, image, category_id, stock, weight, is_featured, slug, req.params.id]
        );
        res.json({ message: 'Product updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Admin: Delete product
router.delete('/:id', protect, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
    try {
        await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
        res.json({ message: 'Product removed' });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
