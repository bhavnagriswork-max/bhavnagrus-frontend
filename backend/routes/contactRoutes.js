const express = require('express');
const router = express.Router();
const { submitContactForm, getInquiriesAdmin, updateInquiryStatusAdmin } = require('../controllers/contactController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

router.post('/', submitContactForm);
// We will also mount the admin parts in adminRoutes, but we can do it here for simplicity
router.get('/admin', protect, admin, getInquiriesAdmin);
router.put('/admin/:id/status', protect, admin, updateInquiryStatusAdmin);

module.exports = router;
