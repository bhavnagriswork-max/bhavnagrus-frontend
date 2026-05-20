const pool = require('../config/db');

// @desc    Get reviews for a product
// @route   GET /api/products/:id/reviews
// @access  Public
const getProductReviews = async (req, res) => {
    try {
        const [reviews] = await pool.query(
            'SELECT * FROM reviews WHERE product_id = ? AND is_approved = 1 ORDER BY created_at DESC',
            [req.params.id]
        );
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Post a review
// @route   POST /api/products/:id/reviews
// @access  Public (or Protected if you want only buyers)
const postReview = async (req, res) => {
    try {
        const { user_name, rating, comment, image_url } = req.body;
        const product_id = req.params.id;

        await pool.query(
            'INSERT INTO reviews (product_id, user_name, rating, comment, image_url) VALUES (?, ?, ?, ?, ?)',
            [product_id, user_name, rating, comment, image_url]
        );

        res.status(201).json({ message: 'Review submitted for approval' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getProductReviews, postReview };
