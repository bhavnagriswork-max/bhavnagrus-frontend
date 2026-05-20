const express = require('express');
const router = express.Router();
const { trackVisit, getAnalyticsStats } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

// Public - track visits
router.post('/track', trackVisit);

// Admin only - get stats
router.get('/stats', protect, admin, getAnalyticsStats);

module.exports = router;
