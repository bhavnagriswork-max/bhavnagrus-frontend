const express = require('express');
const router = express.Router();
const { getProductReviews, postReview } = require('../controllers/reviewController');

router.get('/:id/reviews', getProductReviews);
router.post('/:id/reviews', postReview);

module.exports = router;
