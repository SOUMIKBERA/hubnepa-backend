const express = require('express');
const router = express.Router();
const ctrl = require('./delivery-panel.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

router.use(protect, authorize('delivery'));

// Profile
router.get('/profile', ctrl.getProfile);
router.put('/profile', ctrl.updateProfile);
router.put('/status', ctrl.toggleStatus);
router.put('/location', ctrl.updateLocation);

// Orders
router.get('/available-orders', ctrl.getAvailableOrders);
router.put('/orders/:id/accept', ctrl.acceptOrder);
router.put('/orders/:id/decline', ctrl.declineOrder);
router.put('/orders/:id/status', ctrl.updateOrderStatus);

// My deliveries
router.get('/my-deliveries', ctrl.getMyDeliveries);
router.get('/my-deliveries/:id', ctrl.getDeliveryById);

// Earnings
router.get('/earnings', ctrl.getEarnings);
router.post('/earnings/payout', ctrl.requestPayout);
router.get('/history', ctrl.getHistory);

// Settings
router.get('/settings', ctrl.getSettings);
router.put('/settings', ctrl.updateSettings);

module.exports = router;