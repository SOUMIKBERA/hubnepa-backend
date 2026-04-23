const { AdminRole, AdminUser, AuditLog, Complaint, Campaign, PlatformSetting } = require('./admin-panel.model');
const User = require('../auth/auth.model');
const Restaurant = require('../restaurant/restaurant.model');
const Product = require('../product/product.model');
const Order = require('../order/order.model');
const Notification = require('../notification/notification.model');
const Voucher = require('../payment/voucher.model');
const paginate = require('../../utils/paginate');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// ─── Audit ────
const log = async (userId, action, resource, id, details, req) => {
  try {
    await AuditLog.create({ performedBy: userId, action, targetResource: resource, targetId: id, details, ipAddress: req?.ip, userAgent: req?.headers?.['user-agent'] });
  } catch (_) {}
};

// ─── Dashboard ─────
const getDashboard = async (adminId, req) => {
  const today = new Date(); today.setHours(0,0,0,0);
  const [totalUsers, totalRestaurants, totalOrders, totalRevenue, pendingRestaurants, pendingProducts, todayOrders, recentOrders, usersByRole] = await Promise.all([
    User.countDocuments({ isActive: true }),
    Restaurant.countDocuments({ status: 'approved' }),
    Order.countDocuments(),
    Order.aggregate([{ $match: { status: 'delivered' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Restaurant.countDocuments({ status: 'pending' }),
    Product.countDocuments({ status: 'pending' }),
    Order.countDocuments({ createdAt: { $gte: today } }),
    Order.find().sort({ createdAt: -1 }).limit(5).populate('customer', 'firstName lastName').populate('restaurant', 'name').select('orderId total status orderType createdAt'),
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
  ]);
  await log(adminId, 'Viewed Dashboard', 'Dashboard', null, null, req);
  return { totalUsers, totalRestaurants, totalOrders, totalRevenue: totalRevenue[0]?.total || 0, pendingRestaurants, pendingProducts, todayOrders, recentOrders, usersByRole };
};

// ─── Users ─────
const getUsers = async (query) => {
  const filter = {};
  if (query.role) filter.role = query.role;
  if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';
  if (query.search) filter.$or = [{ firstName: new RegExp(query.search,'i') }, { lastName: new RegExp(query.search,'i') }, { email: new RegExp(query.search,'i') }];
  return paginate(User, filter, { page: query.page, limit: query.limit, sort: { createdAt: -1 }, select: '-password -refreshToken' });
};

const getUserById = async (userId) => {
  const user = await User.findById(userId).select('-password -refreshToken');
  if (!user) { const e = new Error('User not found.'); e.statusCode = 404; throw e; }
  const [orderStats, paymentHistory] = await Promise.all([
    Order.aggregate([{ $match: { customer: mongoose.Types.ObjectId(userId) } }, { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$total' } } }]),
    Order.find({ customer: userId }).select('orderId total paymentStatus paymentMethod createdAt').sort({ createdAt: -1 }).limit(10),
  ]);
  return { user, orderStats, paymentHistory };
};

const updateUser = async (adminId, userId, data, req) => {
  const allowed = ['firstName', 'lastName', 'phone', 'isActive', 'role', 'membershipTier'];
  const update = {};
  allowed.forEach(k => { if (data[k] !== undefined) update[k] = data[k]; });
  const user = await User.findByIdAndUpdate(userId, update, { new: true }).select('-password');
  await log(adminId, 'Updated User', 'User', userId, JSON.stringify(update), req);
  return user;
};

const blockUser = async (adminId, userId, blocked, reason, req) => {
  await User.findByIdAndUpdate(userId, { isActive: !blocked });
  await log(adminId, blocked ? 'Blocked User' : 'Unblocked User', 'User', userId, reason, req);
};

const changeUserRole = async (adminId, userId, role, req) => {
  const user = await User.findByIdAndUpdate(userId, { role }, { new: true }).select('-password');
  await log(adminId, 'Changed User Role', 'User', userId, role, req);
  return user;
};

const deleteUser = async (adminId, userId, reason, req) => {
  await User.findByIdAndUpdate(userId, { isActive: false });
  await log(adminId, 'Deleted User', 'User', userId, reason, req);
};

// ─── Partners ─────
const getRestaurants = async (query) => {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.search) filter.name = new RegExp(query.search, 'i');
  return paginate(Restaurant, filter, { page: query.page, limit: query.limit, sort: { createdAt: -1 }, populate: { path: 'owner', select: 'firstName lastName email phone' } });
};

const approveRestaurant = async (adminId, restaurantId, req) => {
  const r = await Restaurant.findByIdAndUpdate(restaurantId, { status: 'approved' }, { new: true });
  if (r) { await Notification.create({ user: r.owner, title: 'Restaurant Approved!', message: 'Your restaurant is now live on HubNepa.', type: 'system' }); }
  await log(adminId, 'Approved Restaurant', 'Restaurant', restaurantId, null, req);
  return r;
};

const rejectRestaurant = async (adminId, restaurantId, reason, req) => {
  const r = await Restaurant.findByIdAndUpdate(restaurantId, { status: 'rejected' }, { new: true });
  await log(adminId, 'Rejected Restaurant', 'Restaurant', restaurantId, reason, req);
  return r;
};

const createPartner = async (adminId, data, req) => {
  const { firstName, lastName, email, role, businessName } = data;
  const password = await bcrypt.hash(data.password || 'HubNepa@2026!', 12);
  const user = await User.create({ firstName, lastName, email, password, phone: data.phone, role: role || 'retailer', isEmailVerified: true });
  if (role === 'restaurant' && businessName) {
    await Restaurant.create({ owner: user._id, name: businessName, status: 'approved' });
  }
  await log(adminId, 'Created Partner', 'Partner', user._id, `${role}: ${businessName || email}`, req);
  return user;
};

// ─── Products ─────
const getProducts = async (query) => {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.search) filter.name = new RegExp(query.search, 'i');
  if (query.category) filter.category = query.category;
  return paginate(Product, filter, { page: query.page, limit: query.limit, sort: { createdAt: -1 }, populate: { path: 'retailer', select: 'firstName lastName email' } });
};

const approveProduct = async (adminId, productId, req) => {
  const p = await Product.findByIdAndUpdate(productId, { status: 'approved', adminApproved: true }, { new: true });
  if (p) await Notification.create({ user: p.retailer, title: 'Product Approved!', message: `"${p.name}" is now live on the marketplace.`, type: 'product_approved' });
  await log(adminId, 'Approved Product', 'Product', productId, null, req);
  return p;
};

const rejectProduct = async (adminId, productId, reason, req) => {
  const p = await Product.findByIdAndUpdate(productId, { status: 'rejected' }, { new: true });
  await log(adminId, 'Rejected Product', 'Product', productId, reason, req);
  return p;
};

// ─── Orders ──────
const getAllOrders = async (query) => {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.orderType) filter.orderType = query.orderType;
  if (query.search) filter.$or = [{ orderId: new RegExp(query.search, 'i') }];
  return paginate(Order, filter, { page: query.page, limit: query.limit, sort: { createdAt: -1 }, populate: [{ path: 'customer', select: 'firstName lastName email' }, { path: 'restaurant', select: 'name' }] });
};

// ─── Complaints ──────
const getComplaints = async (query) => {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.type) filter.type = query.type;
  if (query.search) filter.$or = [{ description: new RegExp(query.search, 'i') }, { vendorName: new RegExp(query.search, 'i') }];
  const result = await paginate(Complaint, filter, { page: query.page, limit: query.limit, sort: { createdAt: -1 }, populate: [{ path: 'customer', select: 'firstName lastName email' }, { path: 'assignedTo', select: 'firstName lastName' }] });
  const stats = await Complaint.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  return { ...result, stats };
};

const updateComplaint = async (adminId, complaintId, data, req) => {
  const c = await Complaint.findByIdAndUpdate(complaintId, data, { new: true });
  await log(adminId, 'Updated Complaint', 'Complaint', complaintId, data.status, req);
  return c;
};

// ─── Finance ────
const getFinance = async () => {
  const [totalRevenue, pendingSettlements, commissions, weeklyRevenue] = await Promise.all([
    Order.aggregate([{ $match: { status: 'delivered' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Order.aggregate([{ $match: { paymentStatus: 'pending', status: 'delivered' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Order.aggregate([{ $match: { status: 'delivered' } }, { $group: { _id: null, commission: { $sum: { $multiply: ['$total', 0.10] } } } }]),
    Order.aggregate([{ $match: { createdAt: { $gte: new Date(Date.now()-7*24*60*60*1000) }, status: 'delivered' } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } }, { $sort: { '_id': 1 } }]),
  ]);
  return { totalRevenue: totalRevenue[0]?.total || 0, pendingSettlements: pendingSettlements[0]?.total || 0, totalCommissions: commissions[0]?.commission || 0, weeklyRevenue };
};

const getRefunds = async (query) => {
  const filter = { refundStatus: { $ne: 'none' } };
  if (query.status) filter.refundStatus = query.status;
  return paginate(Order, filter, { page: query.page, limit: query.limit, sort: { updatedAt: -1 }, populate: { path: 'customer', select: 'firstName lastName email' } });
};

const processRefund = async (adminId, orderId, action, req) => {
  const order = await Order.findById(orderId);
  if (!order) { const e = new Error('Order not found.'); e.statusCode = 404; throw e; }
  if (action === 'approve') {
    order.refundStatus = 'processed';
    order.paymentStatus = 'refunded';
    await User.findByIdAndUpdate(order.customer, { $inc: { walletBalance: order.refundAmount } });
    await Notification.create({ user: order.customer, title: 'Refund Processed', message: `$${order.refundAmount} has been added to your wallet.`, type: 'payment' });
  } else { order.refundStatus = 'rejected'; }
  await order.save();
  await log(adminId, `Refund ${action}d`, 'Order', orderId, null, req);
  return order;
};

// ─── Analytics ──────
const getAnalytics = async (query) => {
  const days = parseInt(query.days) || 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const [revenueGrowth, salesByCategory, newUsers, topRestaurants] = await Promise.all([
    Order.aggregate([{ $match: { createdAt: { $gte: since }, status: 'delivered' } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } }, { $sort: { '_id': 1 } }]),
    Order.aggregate([{ $match: { status: 'delivered' } }, { $group: { _id: '$orderType', revenue: { $sum: '$total' }, count: { $sum: 1 } } }]),
    User.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }, { $sort: { '_id': 1 } }]),
    Order.aggregate([{ $match: { restaurant: { $ne: null }, status: 'delivered' } }, { $group: { _id: '$restaurant', totalRevenue: { $sum: '$total' }, totalOrders: { $sum: 1 } } }, { $sort: { totalRevenue: -1 } }, { $limit: 5 }, { $lookup: { from: 'restaurants', localField: '_id', foreignField: '_id', as: 'info' } }, { $unwind: '$info' }]),
  ]);
  return { revenueGrowth, salesByCategory, newUsers, topRestaurants, metrics: { cac: 12.50, aov: 45.00, retentionRate: 85 } };
};

// ─── Marketing ────
const getCampaigns = async (query) => {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.type) filter.type = query.type;
  if (query.search) filter.name = new RegExp(query.search, 'i');
  return paginate(Campaign, filter, { page: query.page, limit: query.limit, sort: { createdAt: -1 } });
};

const createCampaign = async (adminId, data, req) => {
  const c = await Campaign.create({ ...data, createdBy: adminId });
  await log(adminId, 'Created Campaign', 'Campaign', c._id, c.name, req);
  return c;
};

const updateCampaign = async (adminId, campaignId, data, req) => {
  const c = await Campaign.findByIdAndUpdate(campaignId, data, { new: true });
  await log(adminId, 'Updated Campaign', 'Campaign', campaignId, data.status, req);
  return c;
};

const deleteCampaign = async (adminId, campaignId, req) => {
  await Campaign.findByIdAndDelete(campaignId);
  await log(adminId, 'Deleted Campaign', 'Campaign', campaignId, null, req);
};

const sendPushNotification = async (adminId, data, req) => {
  const { targetAudience, title, message } = data;
  const filter = {};
  if (targetAudience === 'New Users') { const lm = new Date(); lm.setMonth(lm.getMonth()-1); filter.createdAt = { $gte: lm }; }
  const users = await User.find(filter).select('_id');
  const notifs = users.map(u => ({ user: u._id, title, message, type: 'offer' }));
  if (notifs.length) await Notification.insertMany(notifs);
  await log(adminId, 'Sent Push Notification', 'Notification', null, `Sent to ${users.length} users`, req);
  return { count: users.length };
};

// ─── Vouchers ─────
const getVouchers = async (query) => paginate(Voucher, {}, { page: query.page, limit: query.limit });
const createVoucher = async (adminId, data, req) => { const v = await Voucher.create({ ...data, createdBy: adminId }); await log(adminId, 'Created Voucher', 'Voucher', v._id, v.code, req); return v; };
const updateVoucher = async (adminId, vid, data, req) => { const v = await Voucher.findByIdAndUpdate(vid, data, { new: true }); await log(adminId, 'Updated Voucher', 'Voucher', vid, null, req); return v; };
const deleteVoucher = async (adminId, vid, req) => { await Voucher.findByIdAndDelete(vid); await log(adminId, 'Deleted Voucher', 'Voucher', vid, null, req); };

// ─── SEO ─────
const getSEO = async () => {
  const settings = await PlatformSetting.find({ category: 'seo' });
  return settings.reduce((acc, s) => { acc[s.key] = s.value; return acc; }, {});
};
const updateSEO = async (adminId, data, req) => {
  for (const [key, value] of Object.entries(data)) {
    await PlatformSetting.findOneAndUpdate({ key }, { key, value, category: 'seo', updatedBy: adminId }, { upsert: true });
  }
  await log(adminId, 'Updated SEO Settings', 'PlatformSetting', null, null, req);
};

// ─── Access Control ────
const getRoles = async () => {
  const [roles, admins] = await Promise.all([AdminRole.find().populate('createdBy', 'firstName lastName'), AdminUser.find().populate('user', 'firstName lastName email').populate('role', 'name')]);
  return { roles, admins };
};
const createRole = async (adminId, data, req) => { const r = await AdminRole.create({ ...data, createdBy: adminId }); await log(adminId, 'Created Admin Role', 'AdminRole', r._id, r.name, req); return r; };
const updateRole = async (adminId, roleId, data, req) => { const r = await AdminRole.findByIdAndUpdate(roleId, data, { new: true }); await log(adminId, 'Updated Admin Role', 'AdminRole', roleId, null, req); return r; };
const deleteRole = async (adminId, roleId, req) => { await AdminRole.findByIdAndDelete(roleId); await log(adminId, 'Deleted Admin Role', 'AdminRole', roleId, null, req); };

const getAdminUsers = async (query) => paginate(AdminUser, {}, { page: query.page, limit: query.limit, populate: [{ path: 'user', select: 'firstName lastName email' }, { path: 'role', select: 'name permissions' }] });
const createAdminUser = async (adminId, data, req) => {
  const { fullName, email, roleId, password } = data;
  const [firstName, ...rest] = fullName.split(' ');
  const hashedPwd = await bcrypt.hash(password || 'Admin@HubNepa2026!', 12);
  const user = await User.create({ firstName, lastName: rest.join(' ') || '-', email, password: hashedPwd, role: 'admin', isEmailVerified: true });
  const adminUser = await AdminUser.create({ user: user._id, role: roleId, invitedBy: adminId });
  await log(adminId, 'Created Admin User', 'AdminUser', user._id, email, req);
  return adminUser;
};
const updateAdminPermissions = async (adminId, adminUserId, roleId, req) => { const a = await AdminUser.findByIdAndUpdate(adminUserId, { role: roleId }, { new: true }).populate('role'); await log(adminId, 'Updated Admin Permissions', 'AdminUser', adminUserId, null, req); return a; };
const blockAdminUser = async (adminId, adminUserId, block, req) => { await AdminUser.findByIdAndUpdate(adminUserId, { status: block ? 'Suspended' : 'Active' }); await log(adminId, block ? 'Blocked Admin User' : 'Unblocked Admin User', 'AdminUser', adminUserId, null, req); };
const getAuditLogs = async (query) => {
  const filter = {};
  if (query.action) filter.action = new RegExp(query.action, 'i');
  return paginate(AuditLog, filter, { page: query.page, limit: query.limit, sort: { createdAt: -1 }, populate: { path: 'performedBy', select: 'firstName lastName email' } });
};

// ─── Platform Settings ─────
const getSettings = async () => {
  const settings = await PlatformSetting.find();
  return settings.reduce((acc, s) => { if (!acc[s.category]) acc[s.category] = {}; acc[s.category][s.key] = s.value; return acc; }, {});
};
const updateSettings = async (adminId, data, req) => {
  for (const [key, value] of Object.entries(data)) {
    await PlatformSetting.findOneAndUpdate({ key }, { key, value, updatedBy: adminId }, { upsert: true, new: true });
  }
  await log(adminId, 'Updated Platform Settings', 'PlatformSetting', null, Object.keys(data).join(', '), req);
};
const getLegalDoc = async (type) => { const s = await PlatformSetting.findOne({ key: type }); return { content: s?.value || '' }; };
const updateLegalDoc = async (adminId, type, content, req) => { await PlatformSetting.findOneAndUpdate({ key: type }, { key: type, value: content, category: 'legal', updatedBy: adminId }, { upsert: true }); await log(adminId, `Updated ${type}`, 'Legal', null, null, req); };
const setMaintenanceMode = async (adminId, enabled, req) => { await PlatformSetting.findOneAndUpdate({ key: 'maintenanceMode' }, { key: 'maintenanceMode', value: enabled, category: 'system', updatedBy: adminId }, { upsert: true }); await log(adminId, `Maintenance Mode ${enabled ? 'Enabled' : 'Disabled'}`, 'PlatformSetting', null, null, req); };

// ─── Reports ────
const getReports = async (query) => {
  const days = parseInt(query.days) || 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const [revenue, ordersByStatus, newUsers, topRestaurants] = await Promise.all([
    Order.aggregate([{ $match: { createdAt: { $gte: since }, status: 'delivered' } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } }, { $sort: { '_id': 1 } }]),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    User.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }, { $sort: { '_id': 1 } }]),
    Order.aggregate([{ $match: { restaurant: { $ne: null }, status: 'delivered' } }, { $group: { _id: '$restaurant', totalOrders: { $sum: 1 }, totalRevenue: { $sum: '$total' } } }, { $sort: { totalRevenue: -1 } }, { $limit: 5 }, { $lookup: { from: 'restaurants', localField: '_id', foreignField: '_id', as: 'info' } }, { $unwind: '$info' }]),
  ]);
  return { revenue, ordersByStatus, newUsers, topRestaurants };
};

module.exports = { log, getDashboard, getUsers, getUserById, updateUser, blockUser, changeUserRole, deleteUser, getRestaurants, approveRestaurant, rejectRestaurant, createPartner, getProducts, approveProduct, rejectProduct, getAllOrders, getComplaints, updateComplaint, getFinance, getRefunds, processRefund, getAnalytics, getCampaigns, createCampaign, updateCampaign, deleteCampaign, sendPushNotification, getVouchers, createVoucher, updateVoucher, deleteVoucher, getSEO, updateSEO, getRoles, createRole, updateRole, deleteRole, getAdminUsers, createAdminUser, updateAdminPermissions, blockAdminUser, getAuditLogs, getSettings, updateSettings, getLegalDoc, updateLegalDoc, setMaintenanceMode, getReports };