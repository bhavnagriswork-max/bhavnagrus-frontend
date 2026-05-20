const express = require('express');
const router = express.Router();
const { subscribe, getSubscribers, deleteSubscriber } = require('../controllers/subscriberController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

router.post('/', subscribe);
router.get('/', protect, admin, getSubscribers);
router.delete('/:id', protect, admin, deleteSubscriber);

module.exports = router;
