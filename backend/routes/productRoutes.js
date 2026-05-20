const express = require('express');
const router = express.Router();
const { getProducts, getProductById, getProductBySlug, getFeaturedProducts } = require('../controllers/productController');

router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/:id', getProductById);
router.get('/slug/:slug', getProductBySlug);

module.exports = router;
