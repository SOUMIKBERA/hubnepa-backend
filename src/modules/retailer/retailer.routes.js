const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../auth/auth.model');
const Product = require('../product/product.model');
const Order = require('../order/order.model');
const Notification = require('../notification/notification.model');
const { RetailerProfile } = require('./retailer.model');
const Offer = require('./offer.model');
const { successResponse } = require('../../utils/apiResponse');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const paginate = require('../../utils/paginate');

router.use(protect, authorize('retailer'));

// DASHBOARD
router.get('/dashboard', async (req, res, next) => {
  try {
    const rid = new mongoose.Types.ObjectId(req.user._id);
    const lastMonthStart = new Date(); lastMonthStart.setMonth(lastMonthStart.getMonth() - 1); lastMonthStart.setDate(1); lastMonthStart.setHours(0,0,0,0);
    const lastMonthEnd = new Date(); lastMonthEnd.setDate(0); lastMonthEnd.setHours(23,59,59,999);
    const [totalRevenue, lastMonthRevenue, totalOrders, totalProducts, pendingPayments, recentOrders, weeklySales, dailyOrders] = await Promise.all([
      Order.aggregate([{ $match: { retailer: rid, status: 'delivered' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.aggregate([{ $match: { retailer: rid, status: 'delivered', createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.countDocuments({ retailer: req.user._id }),
      Product.countDocuments({ retailer: req.user._id }),
      Order.aggregate([{ $match: { retailer: rid, paymentStatus: 'pending' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.find({ retailer: req.user._id }).sort({ createdAt: -1 }).limit(5).populate('customer', 'firstName lastName email'),
      Order.aggregate([{ $match: { retailer: rid, createdAt: { $gte: new Date(Date.now() - 7*24*60*60*1000) } } }, { $group: { _id: { $dayOfWeek: '$createdAt' }, revenue: { $sum: '$total' } } }, { $sort: { '_id': 1 } }]),
      Order.aggregate([{ $match: { retailer: rid, createdAt: { $gte: new Date(Date.now() - 7*24*60*60*1000) } } }, { $group: { _id: { $dayOfWeek: '$createdAt' }, count: { $sum: 1 } } }, { $sort: { '_id': 1 } }]),
    ]);
    return successResponse(res, 200, 'Dashboard fetched.', { totalRevenue: totalRevenue[0]?.total||0, totalOrders, totalProducts, pendingPayments: pendingPayments[0]?.total||0, lastMonthRevenue: lastMonthRevenue[0]?.total||0, recentOrders, weeklySales, dailyOrders });
  } catch (e) { next(e); }
});

// PRODUCTS CRUD
router.get('/products', async (req, res, next) => {
  try {
    const filter = { retailer: req.user._id };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.status) filter.stockStatus = req.query.status;
    if (req.query.search) filter.$text = { $search: req.query.search };
    const result = await paginate(Product, filter, { page: req.query.page, limit: req.query.limit, sort: { createdAt: -1 } });
    return successResponse(res, 200, 'Products fetched.', result);
  } catch (e) { next(e); }
});
router.post('/products', async (req, res, next) => {
  try {
    const slug = req.body.name.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'') + '-' + Date.now();
    const product = await Product.create({ ...req.body, retailer: req.user._id, slug, status: 'pending' });
    return successResponse(res, 201, 'Product submitted for approval.', { product });
  } catch (e) { next(e); }
});
router.get('/products/:id', async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, retailer: req.user._id });
    if (!product) return res.status(404).json({ success: false, message: 'Not found.' });
    return successResponse(res, 200, 'Product fetched.', { product });
  } catch (e) { next(e); }
});
router.put('/products/:id', async (req, res, next) => {
  try {
    const product = await Product.findOneAndUpdate({ _id: req.params.id, retailer: req.user._id }, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Not found.' });
    return successResponse(res, 200, 'Product updated.', { product });
  } catch (e) { next(e); }
});
router.delete('/products/:id', async (req, res, next) => {
  try {
    await Product.findOneAndDelete({ _id: req.params.id, retailer: req.user._id });
    return successResponse(res, 200, 'Product deleted.');
  } catch (e) { next(e); }
});

// ORDERS
router.get('/orders', async (req, res, next) => {
  try {
    const filter = { retailer: req.user._id };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) filter.$or = [{ orderId: new RegExp(req.query.search,'i') }];
    const result = await paginate(Order, filter, { page: req.query.page, limit: req.query.limit, sort: { createdAt: -1 }, populate: { path: 'customer', select: 'firstName lastName email phone' } });
    return successResponse(res, 200, 'Orders fetched.', result);
  } catch (e) { next(e); }
});
router.get('/orders/:id', async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, retailer: req.user._id }).populate('customer','firstName lastName email phone').populate('deliveryPartner','firstName lastName phone');
    if (!order) return res.status(404).json({ success: false, message: 'Not found.' });
    return successResponse(res, 200, 'Order fetched.', { order });
  } catch (e) { next(e); }
});
router.put('/orders/:id/status', async (req, res, next) => {
  try {
    const order = await Order.findOneAndUpdate({ _id: req.params.id, retailer: req.user._id }, { status: req.body.status, $push: { statusHistory: { status: req.body.status, timestamp: new Date() } } }, { new: true });
    if (!order) return res.status(404).json({ success: false, message: 'Not found.' });
    await Notification.create({ user: order.customer, title: 'Order Update', message: `Your order #${order.orderId} is now ${req.body.status}.`, type: 'order_update' });
    return successResponse(res, 200, 'Status updated.', { order });
  } catch (e) { next(e); }
});

// CUSTOMERS
router.get('/customers', async (req, res, next) => {
  try {
    const rid = new mongoose.Types.ObjectId(req.user._id);
    const page = parseInt(req.query.page)||1; const limit = parseInt(req.query.limit)||10;
    const customers = await Order.aggregate([
      { $match: { retailer: rid } },
      { $group: { _id: '$customer', totalOrders: { $sum: 1 }, totalSpent: { $sum: '$total' }, lastOrder: { $max: '$createdAt' } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { customer: { _id: '$user._id', firstName: '$user.firstName', lastName: '$user.lastName', email: '$user.email', createdAt: '$user.createdAt' }, totalOrders: 1, totalSpent: 1, lastOrder: 1 } },
      { $sort: { totalSpent: -1 } }, { $skip: (page-1)*limit }, { $limit: limit },
    ]);
    return successResponse(res, 200, 'Customers fetched.', { data: customers });
  } catch (e) { next(e); }
});

// OFFERS CRUD
router.get('/offers', async (req, res, next) => {
  try {
    const filter = { retailer: req.user._id };
    if (req.query.activeOnly === 'true') filter.isActive = true;
    const result = await paginate(Offer, filter, { page: req.query.page, limit: req.query.limit });
    return successResponse(res, 200, 'Offers fetched.', result);
  } catch (e) { next(e); }
});
router.post('/offers', async (req, res, next) => {
  try {
    const offer = await Offer.create({ ...req.body, retailer: req.user._id });
    return successResponse(res, 201, 'Offer created.', { offer });
  } catch (e) { next(e); }
});
router.put('/offers/:id', async (req, res, next) => {
  try {
    const offer = await Offer.findOneAndUpdate({ _id: req.params.id, retailer: req.user._id }, req.body, { new: true });
    return successResponse(res, 200, 'Offer updated.', { offer });
  } catch (e) { next(e); }
});
router.delete('/offers/:id', async (req, res, next) => {
  try {
    await Offer.findOneAndDelete({ _id: req.params.id, retailer: req.user._id });
    return successResponse(res, 200, 'Offer deleted.');
  } catch (e) { next(e); }
});

// FINANCE
router.get('/finance', async (req, res, next) => {
  try {
    const rid = new mongoose.Types.ObjectId(req.user._id);
    const [available, pending, transactions] = await Promise.all([
      Order.aggregate([{ $match: { retailer: rid, status: 'delivered', paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.aggregate([{ $match: { retailer: rid, status: { $in: ['pending','confirmed','in_transit'] }, paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.find({ retailer: req.user._id }).sort({ createdAt: -1 }).limit(20).select('orderId total paymentStatus status createdAt').lean(),
    ]);
    return successResponse(res, 200, 'Finance fetched.', { availableBalance: available[0]?.total||0, pendingClearance: pending[0]?.total||0, nextPayout: new Date(Date.now()+2*24*60*60*1000), transactions });
  } catch (e) { next(e); }
});
router.post('/finance/withdraw', async (req, res, next) => {
  try {
    return successResponse(res, 200, 'Withdrawal request submitted.', { amount: req.body.amount, status: 'Processing' });
  } catch (e) { next(e); }
});

// REFUNDS
router.get('/refunds', async (req, res, next) => {
  try {
    const filter = { retailer: req.user._id, refundStatus: { $ne: 'none' } };
    if (req.query.status) filter.refundStatus = req.query.status;
    const result = await paginate(Order, filter, { page: req.query.page, limit: req.query.limit, sort: { updatedAt: -1 }, populate: { path: 'customer', select: 'firstName lastName email' } });
    return successResponse(res, 200, 'Refunds fetched.', result);
  } catch (e) { next(e); }
});
router.put('/refunds/:orderId', async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findOne({ _id: req.params.orderId, retailer: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Not found.' });
    order.refundStatus = status;
    if (status === 'approved') {
      await User.findByIdAndUpdate(order.customer, { $inc: { walletBalance: order.refundAmount } });
      order.paymentStatus = 'refunded';
      await Notification.create({ user: order.customer, title: 'Refund Approved', message: `$${order.refundAmount} added to wallet.`, type: 'refund' });
    }
    await order.save();
    return successResponse(res, 200, `Refund ${status}.`, { order });
  } catch (e) { next(e); }
});

// REPORTS
router.get('/reports', async (req, res, next) => {
  try {
    const rid = new mongoose.Types.ObjectId(req.user._id);
    const days = parseInt(req.query.days)||7;
    const since = new Date(Date.now() - days*24*60*60*1000);
    const [dailyRevenue, categoryBreakdown, topProducts, orderStats] = await Promise.all([
      Order.aggregate([{ $match: { retailer: rid, createdAt: { $gte: since }, status: 'delivered' } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } }, { $sort: { '_id': 1 } }]),
      Order.aggregate([{ $match: { retailer: rid } }, { $unwind: '$items' }, { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'prod' } }, { $unwind: { path: '$prod', preserveNullAndEmptyArrays: true } }, { $group: { _id: '$prod.category', revenue: { $sum: '$items.subtotal' }, units: { $sum: '$items.quantity' } } }, { $sort: { revenue: -1 } }]),
      Order.aggregate([{ $match: { retailer: rid } }, { $unwind: '$items' }, { $group: { _id: '$items.product', name: { $first: '$items.name' }, units: { $sum: '$items.quantity' }, revenue: { $sum: '$items.subtotal' } } }, { $sort: { revenue: -1 } }, { $limit: 5 }]),
      Order.aggregate([{ $match: { retailer: rid } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);
    return successResponse(res, 200, 'Reports fetched.', { dailyRevenue, categoryBreakdown, topProducts, orderStats });
  } catch (e) { next(e); }
});

// NOTIFICATIONS
router.get('/notifications', async (req, res, next) => {
  try {
    const result = await paginate(Notification, { user: req.user._id }, { page: req.query.page, limit: req.query.limit||20, sort: { createdAt: -1 } });
    return successResponse(res, 200, 'Notifications fetched.', result);
  } catch (e) { next(e); }
});
router.put('/notifications/read-all', async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    return successResponse(res, 200, 'All marked as read.');
  } catch (e) { next(e); }
});

// SETTINGS
router.get('/settings', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password -refreshToken');
    let profile = await RetailerProfile.findOne({ user: req.user._id });
    if (!profile) profile = await RetailerProfile.create({ user: req.user._id, storeName: `${user.firstName}'s Store` });
    return successResponse(res, 200, 'Settings fetched.', { user, profile });
  } catch (e) { next(e); }
});
router.put('/settings/profile', async (req, res, next) => {
  try {
    const allowedUser = ['firstName','lastName','phone','avatar'];
    const userUpdate = {};
    allowedUser.forEach(k => { if (req.body[k] !== undefined) userUpdate[k] = req.body[k]; });
    if (Object.keys(userUpdate).length) await User.findByIdAndUpdate(req.user._id, userUpdate);
    const profile = await RetailerProfile.findOneAndUpdate({ user: req.user._id }, req.body, { new: true, upsert: true });
    return successResponse(res, 200, 'Profile saved.', { profile });
  } catch (e) { next(e); }
});
router.put('/settings/kyc', async (req, res, next) => {
  try {
    const profile = await RetailerProfile.findOneAndUpdate({ user: req.user._id }, { $set: { kyc: req.body } }, { new: true, upsert: true });
    return successResponse(res, 200, 'KYC updated.', { profile });
  } catch (e) { next(e); }
});
router.put('/settings/notifications', async (req, res, next) => {
  try {
    const profile = await RetailerProfile.findOneAndUpdate({ user: req.user._id }, { notificationPrefs: req.body }, { new: true, upsert: true });
    return successResponse(res, 200, 'Notification preferences saved.', { profile });
  } catch (e) { next(e); }
});
router.put('/settings/security', async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (currentPassword && newPassword) {
      const user = await User.findById(req.user._id).select('+password');
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
      user.password = newPassword;
      await user.save();
    }
    return successResponse(res, 200, 'Security updated.');
  } catch (e) { next(e); }
});

// SUPPORT
router.get('/support/tickets', async (req, res, next) => {
  try {
    const Ticket = mongoose.models.Ticket;
    if (!Ticket) return successResponse(res, 200, 'No tickets.', { data: [] });
    const result = await paginate(Ticket, { user: req.user._id }, { page: req.query.page, limit: req.query.limit, sort: { updatedAt: -1 } });
    return successResponse(res, 200, 'Tickets fetched.', result);
  } catch (e) { next(e); }
});
router.post('/support/tickets', async (req, res, next) => {
  try {
    const Ticket = mongoose.models.Ticket;
    if (!Ticket) return res.status(503).json({ success: false, message: 'Support unavailable.' });
    const ticket = await Ticket.create({ user: req.user._id, ...req.body, messages: [{ sender: req.user._id, senderRole: 'user', message: req.body.message }] });
    return successResponse(res, 201, 'Ticket created.', { ticket });
  } catch (e) { next(e); }
});

module.exports = router;
