const express = require('express');
const router = express.Router();
const { getPublicSettings, getUpiSettings } = require('../controllers/settingsController');

router.get('/public', getPublicSettings);
router.get('/upi', getUpiSettings);

module.exports = router;
