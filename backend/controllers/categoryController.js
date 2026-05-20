const pool = require('../config/db');

// @desc    Get all active categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res) => {
    try {
        const [categories] = await pool.query('SELECT * FROM categories WHERE is_active = 1');
        res.json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all categories (for admin)
// @route   GET /api/admin/categories
// @access  Private/Admin
const getAllCategoriesAdmin = async (req, res) => {
    try {
        const [categories] = await pool.query('SELECT * FROM categories');
        res.json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create a category
// @route   POST /api/admin/categories
// @access  Private/Admin
const createCategory = async (req, res) => {
    try {
        const { name, slug, description } = req.body;
        const image = req.file ? req.file.path.replace(/\\/g, '/') : null;

        const [result] = await pool.query(
            'INSERT INTO categories (name, slug, image, description) VALUES (?, ?, ?, ?)',
            [name, slug, image, description]
        );

        res.status(201).json({ message: 'Category created', id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update a category
// @route   PUT /api/admin/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res) => {
    try {
        const { name, slug, description, is_active } = req.body;
        const categoryId = req.params.id;
        
        let updateQuery = 'UPDATE categories SET name=?, slug=?, description=?, is_active=? WHERE id=?';
        let queryParams = [name, slug, description, is_active, categoryId];

        if (req.file) {
            const image = req.file.path.replace(/\\/g, '/');
            updateQuery = 'UPDATE categories SET name=?, slug=?, image=?, description=?, is_active=? WHERE id=?';
            queryParams = [name, slug, image, description, is_active, categoryId];
        }

        await pool.query(updateQuery, queryParams);
        res.json({ message: 'Category updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete a category
// @route   DELETE /api/admin/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res) => {
    try {
        await pool.query('DELETE FROM categories WHERE id=?', [req.params.id]);
        res.json({ message: 'Category deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getCategories,
    getAllCategoriesAdmin,
    createCategory,
    updateCategory,
    deleteCategory
};
