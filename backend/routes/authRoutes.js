const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile, updateUserProfile, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.put('/change-password', protect, changePassword);

router.get('/global-stats', async (req, res) => {
    const pool = require('../config/db');
    try {
        const [[{ globalScore }]] = await pool.query('SELECT COUNT(*) as globalScore FROM orders WHERE order_status != "Cancelled"');
        res.json({ global_dog_score: globalScore || 0 });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
