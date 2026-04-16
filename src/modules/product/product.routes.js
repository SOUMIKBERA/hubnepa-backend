const express = require('express');
const router = express.Router();
const ctrl = require('./product.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

// Public
router.get('/', ctrl.getProducts);
router.get('/:id', ctrl.getProductById);

// Retailer only
router.use(protect);
router.post('/', authorize('retailer'), ctrl.createProduct);
router.get('/my/products', authorize('retailer'), ctrl.getMyProducts);
router.get('/my/dashboard', authorize('retailer'), ctrl.getRetailerDashboard);
router.put('/:id', authorize('retailer'), ctrl.updateProduct);
router.delete('/:id', authorize('retailer'), ctrl.deleteProduct);

module.exports = router;