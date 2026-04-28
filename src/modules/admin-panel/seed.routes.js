/**
 * Seed / Fix Route — Admin only
 * POST /api/v1/admin/seed/fix-all  → fixes all pending records + adds welcome notifications
 * GET  /api/v1/admin/seed/status   → shows current counts
 */
const express = require('express');
const router = express.Router();
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

router.post('/fix-all', protect, authorize('admin'), async (req, res, next) => {
  try {
    const Restaurant = require('../restaurant/restaurant.model');
    const Product = require('../product/product.model');
    const Notification = require('../notification/notification.model');
    const User = require('../auth/auth.model');
    const results = {};

    // 1. Approve all pending restaurants
    const rResult = await Restaurant.updateMany(
      { status: 'pending' },
      { $set: { status: 'approved' } }
    );
    results.restaurantsApproved = rResult.modifiedCount;

    // 2. Approve all pending products
    const pResult = await Product.updateMany(
      { status: 'pending' },
      { $set: { status: 'approved', adminApproved: true } }
    );
    results.productsApproved = pResult.modifiedCount;

    // 3. Add welcome notification to all users who have none
    const allUsers = await User.find({}).select('_id firstName role');
    let notifAdded = 0;
    for (const u of allUsers) {
      const existing = await Notification.countDocuments({ user: u._id });
      if (existing === 0) {
        let msg = 'Welcome to HubNepa! Your account is ready.';
        if (u.role === 'customer') msg = 'Browse 500+ restaurants and fresh organic groceries. Your first order awaits!';
        else if (u.role === 'restaurant') msg = 'Your restaurant profile is approved. Set up your menu and start receiving orders!';
        else if (u.role === 'retailer') msg = 'Your store is approved. Add products to start selling on the marketplace!';
        else if (u.role === 'delivery') msg = 'Welcome to the fleet! Complete your profile and go online to start earning.';
        else if (u.role === 'supplier') msg = 'Your supplier account is ready. Add your wholesale catalog to reach premium buyers.';
        else if (u.role === 'admin') msg = 'Welcome to the HubNepa admin panel. You have full platform access.';

        await Notification.create({
          user: u._id,
          title: `Welcome to HubNepa, ${u.firstName}! 🎉`,
          message: msg,
          type: 'system',
        });
        notifAdded++;
      }
    }
    results.welcomeNotificationsAdded = notifAdded;

    return res.json({ success: true, message: 'All records fixed successfully.', data: results });
  } catch (err) { next(err); }
});

router.get('/status', protect, authorize('admin'), async (req, res, next) => {
  try {
    const Restaurant = require('../restaurant/restaurant.model');
    const Product = require('../product/product.model');
    const Notification = require('../notification/notification.model');
    const User = require('../auth/auth.model');

    const [pendingR, pendingP, totalR, totalP, totalN, totalU] = await Promise.all([
      Restaurant.countDocuments({ status: 'pending' }),
      Product.countDocuments({ status: 'pending' }),
      Restaurant.countDocuments(),
      Product.countDocuments(),
      Notification.countDocuments(),
      User.countDocuments(),
    ]);

    return res.json({
      success: true,
      data: {
        pendingRestaurants: pendingR,
        pendingProducts: pendingP,
        totalRestaurants: totalR,
        totalProducts: totalP,
        totalNotifications: totalN,
        totalUsers: totalU,
      },
    });
  } catch (err) { next(err); }
});

module.exports = router;
