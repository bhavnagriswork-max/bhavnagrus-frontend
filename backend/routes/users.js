const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/authMiddleware');

router.get('/', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
    try {
        const [users] = await db.query('SELECT id, name, email, role, created_at FROM users');
        res.json(users);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;
