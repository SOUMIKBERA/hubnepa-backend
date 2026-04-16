const express = require('express');
const router = express.Router();
const ctrl = require('./order.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

router.use(protect);

// Customer
router.post('/', authorize('customer'), ctrl.placeOrder);
router.get('/my', authorize('customer'), ctrl.getMyOrders);
router.get('/my/:id', authorize('customer'), ctrl.getOrderById);
router.put('/my/:id/cancel', authorize('customer'), ctrl.cancelOrder);
router.post('/my/:id/refund', authorize('customer'), ctrl.requestRefund);
router.post('/my/:id/reorder', authorize('customer'), ctrl.reorder);

// Restaurant
router.get('/restaurant', authorize('restaurant'), ctrl.getRestaurantOrders);
router.put('/restaurant/:id/status', authorize('restaurant'), ctrl.updateOrderStatus);

// Retailer
router.get('/retailer', authorize('retailer'), ctrl.getRetailerOrders);
router.put('/retailer/:id/status', authorize('retailer'), ctrl.updateOrderStatus);

// Delivery partner
router.put('/delivery/:id/status', authorize('delivery'), ctrl.updateOrderStatus);

module.exports = router;