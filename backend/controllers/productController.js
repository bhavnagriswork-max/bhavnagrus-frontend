const pool = require('../config/db');

const getProducts = async (req, res) => {
    try {
        let query = `
            SELECT p.*, COALESCE(AVG(r.rating), 5) as average_rating 
            FROM products p 
            LEFT JOIN reviews r ON p.id = r.product_id
            WHERE p.is_active = 1 
        `;
        const params = [];
        
        if (req.query.brand) {
            query += ` AND p.brand = ? `;
            params.push(req.query.brand);
        }
        
        query += ` GROUP BY p.id `;
        
        const [products] = await pool.query(query, params);
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getProductById = async (req, res) => {
    try {
        const [products] = await pool.query('SELECT * FROM products WHERE id = ? AND is_active = 1', [req.params.id]);
        if (products.length > 0) {
            const [images] = await pool.query('SELECT * FROM product_images WHERE product_id = ? ORDER BY sequence_order ASC', [req.params.id]);
            res.json({ ...products[0], images });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getProductBySlug = async (req, res) => {
    try {
        const [products] = await pool.query('SELECT * FROM products WHERE slug = ? AND is_active = 1', [req.params.slug]);
        if (products.length > 0) {
            const [images] = await pool.query('SELECT * FROM product_images WHERE product_id = ? ORDER BY sequence_order ASC', [products[0].id]);
            res.json({ ...products[0], images });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getFeaturedProducts = async (req, res) => {
    try {
        const [products] = await pool.query('SELECT * FROM products WHERE is_featured = 1 AND is_active = 1 LIMIT 8');
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin handlers
const getAllProductsAdmin = async (req, res) => {
    try {
        const [products] = await pool.query(`
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id
            ORDER BY p.id DESC
        `);
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const createProduct = async (req, res) => {
    try {
        const { category_id, name, slug, description, ingredients, original_price, selling_price, discount_percentage, weight, stock, image, additional_images, is_featured, is_active, brand } = req.body;
        
        const stockVal = stock || req.body.stock_quantity || 0;
        const brandVal = brand || 'Bhavnagris';

        const [result] = await pool.query(
            `INSERT INTO products 
            (category_id, name, slug, description, ingredients, original_price, selling_price, discount_percentage, weight, stock_quantity, image, is_featured, spiciness, is_active, brand) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [category_id, name, slug, description, ingredients, original_price, selling_price, discount_percentage || 0, weight, stockVal, image, is_featured || 0, req.body.spiciness || 0, is_active || 1, brandVal]
        );

        const product_id = result.insertId;

        // Save additional images
        if (additional_images && Array.isArray(additional_images)) {
            for (let i = 0; i < additional_images.length; i++) {
                const imgUrl = typeof additional_images[i] === 'string' ? additional_images[i] : additional_images[i].image_url;
                await pool.query('INSERT INTO product_images (product_id, image_url, sequence_order) VALUES (?, ?, ?)', [product_id, imgUrl, i]);
            }
        }

        res.status(201).json({ message: 'Product created', id: product_id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const { category_id, name, slug, description, ingredients, original_price, selling_price, discount_percentage, weight, stock, image, additional_images, is_featured, is_active, brand } = req.body;
        
        const stockVal = stock || req.body.stock_quantity || 0;
        const brandVal = brand || 'Bhavnagris';

        const query = `UPDATE products SET category_id=?, name=?, slug=?, description=?, ingredients=?, original_price=?, selling_price=?, discount_percentage=?, weight=?, stock_quantity=?, image=?, is_featured=?, spiciness=?, is_active=?, brand=? WHERE id=?`;
        const params = [category_id, name, slug, description, ingredients, original_price, selling_price, discount_percentage, weight, stockVal, image, is_featured, req.body.spiciness || 0, is_active, brandVal, id];

        await pool.query(query, params);

        // Update additional images: Delete and Re-insert
        if (additional_images && Array.isArray(additional_images)) {
            await pool.query('DELETE FROM product_images WHERE product_id = ?', [id]);
            for (let i = 0; i < additional_images.length; i++) {
                const imgUrl = typeof additional_images[i] === 'string' ? additional_images[i] : additional_images[i].image_url;
                await pool.query('INSERT INTO product_images (product_id, image_url, sequence_order) VALUES (?, ?, ?)', [id, imgUrl, i]);
            }
        }

        res.json({ message: 'Product updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const productId = req.params.id;

        // 1. Delete from carts first (safe to remove)
        await pool.query('DELETE FROM carts WHERE product_id = ?', [productId]);

        // 2. Try to delete from products
        try {
            await pool.query('DELETE FROM products WHERE id = ?', [productId]);
            res.json({ message: 'Product permanently deleted' });
        } catch (constraintError) {
            // 3. If it fails (likely due to existing orders), do a Soft Delete
            await pool.query('UPDATE products SET is_active = 0 WHERE id = ?', [productId]);
            res.json({ message: 'Product is linked to orders. It has been marked as Inactive instead of deleted.' });
        }
    } catch (error) {
        console.error('Delete Product Error:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

const updateProductSpiciness = async (req, res) => {
    try {
        const { id } = req.params;
        const { spiciness } = req.body;
        
        await pool.query('UPDATE products SET spiciness = ? WHERE id = ?', [spiciness, id]);
        res.json({ message: 'Spiciness updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getProducts, getProductById, getProductBySlug, getFeaturedProducts,
    getAllProductsAdmin, createProduct, updateProduct, deleteProduct,
    updateProductSpiciness
};
