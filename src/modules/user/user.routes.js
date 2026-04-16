const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.use(protect);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.put('/change-password', userController.changePassword);
router.post('/addresses', userController.addAddress);
router.put('/addresses/:id', userController.updateAddress);
router.delete('/addresses/:id', userController.deleteAddress);
router.get('/notifications', userController.getNotifications);
router.put('/notifications/read-all', userController.markAllNotificationsRead);
router.put('/notifications/:id/read', userController.markNotificationRead);
router.put('/preferences', userController.updatePreferences);
router.delete('/account', userController.deleteAccount);

module.exports = router;