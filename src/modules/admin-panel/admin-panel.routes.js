const express = require('express');
const router = express.Router();
const ctrl = require('./admin-panel.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

router.use(protect, authorize('admin'));

// Dashboard
router.get('/dashboard', ctrl.getDashboard);

// User Management
router.get('/users', ctrl.getUsers);
router.get('/users/:id', ctrl.getUserById);
router.put('/users/:id', ctrl.updateUser);
router.put('/users/:id/block', ctrl.blockUser);
router.put('/users/:id/role', ctrl.changeUserRole);
router.delete('/users/:id', ctrl.deleteUser);

// Partner Management
router.get('/partners/restaurants', ctrl.getRestaurants);
router.put('/partners/restaurants/:id/approve', ctrl.approveRestaurant);
router.put('/partners/restaurants/:id/reject', ctrl.rejectRestaurant);
router.put('/partners/restaurants/:id/suspend', ctrl.suspendRestaurant);
router.put('/partners/restaurants/:id/settings', ctrl.updatePartnerSettings);
router.put('/partners/restaurants/:id/verify-document', ctrl.verifyPartnerDocument);
router.delete('/partners/:id', ctrl.deletePartner);
router.post('/partners', ctrl.createPartner);

// Product & Food
router.get('/products', ctrl.getProducts);
router.put('/products/:id', ctrl.updateProduct);
router.put('/products/:id/approve', ctrl.approveProduct);
router.put('/products/:id/reject', ctrl.rejectProduct);
router.get('/menu-items', ctrl.getMenuItems);
router.put('/menu-items/:restaurantId/:itemId', ctrl.updateMenuItem);

// Order Management
router.get('/orders', ctrl.getAllOrders);
router.get('/orders/:id', ctrl.getOrderById);

// Feedback & Complaints
router.get('/complaints', ctrl.getComplaints);
router.post('/complaints', ctrl.createComplaint);
router.put('/complaints/:id', ctrl.updateComplaint);

// Finance & Settlements
router.get('/finance', ctrl.getFinance);
router.get('/finance/refunds', ctrl.getRefunds);
router.put('/finance/refunds/:id', ctrl.processRefund);
router.post('/finance/process-payouts', ctrl.processPayouts);

// Sales Analytics
router.get('/analytics', ctrl.getAnalytics);

// Marketing & Content
router.get('/marketing/campaigns', ctrl.getCampaigns);
router.post('/marketing/campaigns', ctrl.createCampaign);
router.put('/marketing/campaigns/:id', ctrl.updateCampaign);
router.delete('/marketing/campaigns/:id', ctrl.deleteCampaign);
router.post('/marketing/notifications/send', ctrl.sendPushNotification);
router.get('/marketing/seo', ctrl.getSEO);
router.put('/marketing/seo', ctrl.updateSEO);

// Vouchers
router.get('/vouchers', ctrl.getVouchers);
router.post('/vouchers', ctrl.createVoucher);
router.put('/vouchers/:id', ctrl.updateVoucher);
router.delete('/vouchers/:id', ctrl.deleteVoucher);

// Access Control
router.get('/access-control/roles', ctrl.getRoles);
router.post('/access-control/roles', ctrl.createRole);
router.put('/access-control/roles/:id', ctrl.updateRole);
router.delete('/access-control/roles/:id', ctrl.deleteRole);
router.get('/access-control/users', ctrl.getAdminUsers);
router.post('/access-control/users', ctrl.createAdminUser);
router.put('/access-control/users/:id/permissions', ctrl.updateAdminPermissions);
router.put('/access-control/users/:id/block', ctrl.blockAdminUser);
router.get('/access-control/logs', ctrl.getAuditLogs);

// Platform Settings
router.get('/settings', ctrl.getSettings);
router.put('/settings', ctrl.updateSettings);
router.get('/settings/legal/:type', ctrl.getLegalDoc);
router.put('/settings/legal/:type', ctrl.updateLegalDoc);
router.put('/settings/maintenance', ctrl.setMaintenanceMode);

// Notifications
router.get('/notifications', ctrl.getNotifications);
router.put('/notifications/read-all', ctrl.markAllNotificationsRead);

// Reports
router.get('/reports', ctrl.getReports);

module.exports = router;