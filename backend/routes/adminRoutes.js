const express = require('express');
const router = express.Router();
const { getDashboardStats, getAllOrders, updateOrderStatus, updatePaymentStatus, getSettings, updateSettings, getAllUsers, resetUserPassword, deleteOrder, bulkDeleteOrders, getAiSuggestions } = require('../controllers/adminController');
const { globalSearch } = require('../controllers/searchController');
const { getAllCategoriesAdmin, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { getAllProductsAdmin, createProduct, updateProduct, deleteProduct, updateProductSpiciness } = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

router.use(protect, admin); // Secure all routes in this file

// Dashboard
router.get('/dashboard', getDashboardStats);
router.get('/global-search', globalSearch);
router.get('/ai-suggestions', getAiSuggestions);

// Orders
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);
router.put('/orders/:id/payment-status', updatePaymentStatus);
router.delete('/orders/:id', deleteOrder);
router.post('/orders/bulk-delete', bulkDeleteOrders);

// Categories
router.get('/categories', getAllCategoriesAdmin);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Products
router.get('/products', getAllProductsAdmin);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.patch('/products/:id/spiciness', updateProductSpiciness);
router.delete('/products/:id', deleteProduct);

// Settings
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// Users
router.get('/users', getAllUsers);
router.post('/users/reset-password', resetUserPassword);

module.exports = router;
