const svc = require('./admin-panel.service');
const { successResponse } = require('../../utils/apiResponse');

// Dashboard
exports.getDashboard = async (req, res, next) => { try { return successResponse(res, 200, 'Dashboard.', await svc.getDashboard(req.user._id, req)); } catch (e) { next(e); } };

// Users
exports.getUsers = async (req, res, next) => { try { return successResponse(res, 200, 'Users.', await svc.getUsers(req.query)); } catch (e) { next(e); } };
exports.getUserById = async (req, res, next) => { try { return successResponse(res, 200, 'User.', await svc.getUserById(req.params.id)); } catch (e) { next(e); } };
exports.updateUser = async (req, res, next) => { try { const u = await svc.updateUser(req.user._id, req.params.id, req.body, req); return successResponse(res, 200, 'User updated.', { user: u }); } catch (e) { next(e); } };
exports.blockUser = async (req, res, next) => { try { await svc.blockUser(req.user._id, req.params.id, req.body.blocked, req.body.reason, req); return successResponse(res, 200, `User ${req.body.blocked ? 'blocked' : 'unblocked'}.`); } catch (e) { next(e); } };
exports.changeUserRole = async (req, res, next) => { try { const u = await svc.changeUserRole(req.user._id, req.params.id, req.body.role, req); return successResponse(res, 200, 'Role updated.', { user: u }); } catch (e) { next(e); } };
exports.deleteUser = async (req, res, next) => { try { await svc.deleteUser(req.user._id, req.params.id, req.body.reason, req); return successResponse(res, 200, 'User deactivated.'); } catch (e) { next(e); } };

// Partners
exports.getRestaurants = async (req, res, next) => { try { return successResponse(res, 200, 'Restaurants.', await svc.getRestaurants(req.query)); } catch (e) { next(e); } };
exports.approveRestaurant = async (req, res, next) => { try { const r = await svc.approveRestaurant(req.user._id, req.params.id, req); return successResponse(res, 200, 'Restaurant approved.', { restaurant: r }); } catch (e) { next(e); } };
exports.rejectRestaurant = async (req, res, next) => { try { const r = await svc.rejectRestaurant(req.user._id, req.params.id, req.body.reason, req); return successResponse(res, 200, 'Restaurant rejected.', { restaurant: r }); } catch (e) { next(e); } };
exports.suspendRestaurant = async (req, res, next) => { try { const Restaurant = require('../restaurant/restaurant.model'); const r = await Restaurant.findByIdAndUpdate(req.params.id, { status: 'suspended', isOpen: false }, { new: true }); await svc.log(req.user._id, 'Suspended Restaurant', 'Restaurant', req.params.id, req.body.reason, req); return successResponse(res, 200, 'Restaurant suspended.', { restaurant: r }); } catch (e) { next(e); } };
exports.createPartner = async (req, res, next) => { try { const u = await svc.createPartner(req.user._id, req.body, req); return successResponse(res, 201, 'Partner created.', { user: u }); } catch (e) { next(e); } };
exports.verifyPartnerDocument = async (req, res, next) => { try { await svc.log(req.user._id, `Document ${req.body.action}d`, 'Restaurant', req.params.id, req.body.documentType, req); return successResponse(res, 200, `Document ${req.body.action}d.`); } catch (e) { next(e); } };
exports.updatePartnerSettings = async (req, res, next) => { try { const Restaurant = require('../restaurant/restaurant.model'); const r = await Restaurant.findByIdAndUpdate(req.params.id, req.body, { new: true }); return successResponse(res, 200, 'Settings updated.', { restaurant: r }); } catch (e) { next(e); } };
exports.deletePartner = async (req, res, next) => { try { await svc.deleteUser(req.user._id, req.params.id, req.body.reason, req); return successResponse(res, 200, 'Partner removed.'); } catch (e) { next(e); } };

// Products
exports.getProducts = async (req, res, next) => { try { return successResponse(res, 200, 'Products.', await svc.getProducts(req.query)); } catch (e) { next(e); } };
exports.approveProduct = async (req, res, next) => { try { const p = await svc.approveProduct(req.user._id, req.params.id, req); return successResponse(res, 200, 'Product approved.', { product: p }); } catch (e) { next(e); } };
exports.rejectProduct = async (req, res, next) => { try { const p = await svc.rejectProduct(req.user._id, req.params.id, req.body.reason, req); return successResponse(res, 200, 'Product rejected.', { product: p }); } catch (e) { next(e); } };
exports.updateProduct = async (req, res, next) => { try { const Product = require('../product/product.model'); const p = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true }); return successResponse(res, 200, 'Product updated.', { product: p }); } catch (e) { next(e); } };
exports.getMenuItems = async (req, res, next) => { try { const Restaurant = require('../restaurant/restaurant.model'); const filter = {}; if (req.query.restaurantId) filter._id = req.query.restaurantId; const restaurants = await Restaurant.find(filter).select('name menu owner').populate('owner', 'firstName lastName'); const items = restaurants.flatMap(r => r.menu.map(m => ({ ...m.toObject(), restaurantId: r._id, restaurantName: r.name }))); return successResponse(res, 200, 'Menu items.', { data: items.slice(0, 50), total: items.length }); } catch (e) { next(e); } };
exports.updateMenuItem = async (req, res, next) => { try { const Restaurant = require('../restaurant/restaurant.model'); const r = await Restaurant.findById(req.params.restaurantId); if (!r) return res.status(404).json({ success: false, message: 'Restaurant not found.' }); const item = r.menu.id(req.params.itemId); if (!item) return res.status(404).json({ success: false, message: 'Item not found.' }); Object.assign(item, req.body); await r.save(); return successResponse(res, 200, 'Menu item updated.', { item }); } catch (e) { next(e); } };

// Orders
exports.getAllOrders = async (req, res, next) => { try { return successResponse(res, 200, 'Orders.', await svc.getAllOrders(req.query)); } catch (e) { next(e); } };
exports.getOrderById = async (req, res, next) => { try { const Order = require('../order/order.model'); const o = await Order.findById(req.params.id).populate('customer', 'firstName lastName email phone').populate('restaurant', 'name phone').populate('deliveryPartner', 'firstName lastName phone'); if (!o) return res.status(404).json({ success: false, message: 'Not found.' }); return successResponse(res, 200, 'Order.', { order: o }); } catch (e) { next(e); } };

// Complaints
exports.getComplaints = async (req, res, next) => { try { return successResponse(res, 200, 'Complaints.', await svc.getComplaints(req.query)); } catch (e) { next(e); } };
exports.createComplaint = async (req, res, next) => { try { const { Complaint } = require('./admin-panel.model'); const c = await Complaint.create(req.body); return successResponse(res, 201, 'Complaint created.', { complaint: c }); } catch (e) { next(e); } };
exports.updateComplaint = async (req, res, next) => { try { const c = await svc.updateComplaint(req.user._id, req.params.id, req.body, req); return successResponse(res, 200, 'Complaint updated.', { complaint: c }); } catch (e) { next(e); } };

// Finance
exports.getFinance = async (req, res, next) => { try { return successResponse(res, 200, 'Finance.', await svc.getFinance()); } catch (e) { next(e); } };
exports.getRefunds = async (req, res, next) => { try { return successResponse(res, 200, 'Refunds.', await svc.getRefunds(req.query)); } catch (e) { next(e); } };
exports.processRefund = async (req, res, next) => { try { const o = await svc.processRefund(req.user._id, req.params.id, req.body.action, req); return successResponse(res, 200, `Refund ${req.body.action}d.`, { order: o }); } catch (e) { next(e); } };
exports.processPayouts = async (req, res, next) => { try { await svc.log(req.user._id, 'Processed Payouts', 'Finance', null, 'Weekly payout batch', req); return successResponse(res, 200, 'Payouts initiated.', { status: 'Processing' }); } catch (e) { next(e); } };

// Analytics
exports.getAnalytics = async (req, res, next) => { try { return successResponse(res, 200, 'Analytics.', await svc.getAnalytics(req.query)); } catch (e) { next(e); } };

// Marketing
exports.getCampaigns = async (req, res, next) => { try { return successResponse(res, 200, 'Campaigns.', await svc.getCampaigns(req.query)); } catch (e) { next(e); } };
exports.createCampaign = async (req, res, next) => { try { const c = await svc.createCampaign(req.user._id, req.body, req); return successResponse(res, 201, 'Campaign created.', { campaign: c }); } catch (e) { next(e); } };
exports.updateCampaign = async (req, res, next) => { try { const c = await svc.updateCampaign(req.user._id, req.params.id, req.body, req); return successResponse(res, 200, 'Campaign updated.', { campaign: c }); } catch (e) { next(e); } };
exports.deleteCampaign = async (req, res, next) => { try { await svc.deleteCampaign(req.user._id, req.params.id, req); return successResponse(res, 200, 'Campaign deleted.'); } catch (e) { next(e); } };
exports.sendPushNotification = async (req, res, next) => { try { const r = await svc.sendPushNotification(req.user._id, req.body, req); return successResponse(res, 200, `Sent to ${r.count} users.`, r); } catch (e) { next(e); } };
exports.getSEO = async (req, res, next) => { try { return successResponse(res, 200, 'SEO settings.', await svc.getSEO()); } catch (e) { next(e); } };
exports.updateSEO = async (req, res, next) => { try { await svc.updateSEO(req.user._id, req.body, req); return successResponse(res, 200, 'SEO settings saved.'); } catch (e) { next(e); } };

// Vouchers
exports.getVouchers = async (req, res, next) => { try { return successResponse(res, 200, 'Vouchers.', await svc.getVouchers(req.query)); } catch (e) { next(e); } };
exports.createVoucher = async (req, res, next) => { try { const v = await svc.createVoucher(req.user._id, req.body, req); return successResponse(res, 201, 'Voucher created.', { voucher: v }); } catch (e) { next(e); } };
exports.updateVoucher = async (req, res, next) => { try { const v = await svc.updateVoucher(req.user._id, req.params.id, req.body, req); return successResponse(res, 200, 'Voucher updated.', { voucher: v }); } catch (e) { next(e); } };
exports.deleteVoucher = async (req, res, next) => { try { await svc.deleteVoucher(req.user._id, req.params.id, req); return successResponse(res, 200, 'Voucher deleted.'); } catch (e) { next(e); } };

// Access Control
exports.getRoles = async (req, res, next) => { try { return successResponse(res, 200, 'Roles.', await svc.getRoles()); } catch (e) { next(e); } };
exports.createRole = async (req, res, next) => { try { const r = await svc.createRole(req.user._id, req.body, req); return successResponse(res, 201, 'Role created.', { role: r }); } catch (e) { next(e); } };
exports.updateRole = async (req, res, next) => { try { const r = await svc.updateRole(req.user._id, req.params.id, req.body, req); return successResponse(res, 200, 'Role updated.', { role: r }); } catch (e) { next(e); } };
exports.deleteRole = async (req, res, next) => { try { await svc.deleteRole(req.user._id, req.params.id, req); return successResponse(res, 200, 'Role deleted.'); } catch (e) { next(e); } };
exports.getAdminUsers = async (req, res, next) => { try { return successResponse(res, 200, 'Admin users.', await svc.getAdminUsers(req.query)); } catch (e) { next(e); } };
exports.createAdminUser = async (req, res, next) => { try { const a = await svc.createAdminUser(req.user._id, req.body, req); return successResponse(res, 201, 'Admin user created.', { adminUser: a }); } catch (e) { next(e); } };
exports.updateAdminPermissions = async (req, res, next) => { try { const a = await svc.updateAdminPermissions(req.user._id, req.params.id, req.body.roleId, req); return successResponse(res, 200, 'Permissions updated.', { adminUser: a }); } catch (e) { next(e); } };
exports.blockAdminUser = async (req, res, next) => { try { await svc.blockAdminUser(req.user._id, req.params.id, req.body.block, req); return successResponse(res, 200, 'Admin access updated.'); } catch (e) { next(e); } };
exports.getAuditLogs = async (req, res, next) => { try { return successResponse(res, 200, 'Audit logs.', await svc.getAuditLogs(req.query)); } catch (e) { next(e); } };

// Platform Settings
exports.getSettings = async (req, res, next) => { try { return successResponse(res, 200, 'Settings.', { settings: await svc.getSettings() }); } catch (e) { next(e); } };
exports.updateSettings = async (req, res, next) => { try { await svc.updateSettings(req.user._id, req.body, req); return successResponse(res, 200, 'Settings saved.'); } catch (e) { next(e); } };
exports.getLegalDoc = async (req, res, next) => { try { return successResponse(res, 200, 'Legal doc.', await svc.getLegalDoc(req.params.type)); } catch (e) { next(e); } };
exports.updateLegalDoc = async (req, res, next) => { try { await svc.updateLegalDoc(req.user._id, req.params.type, req.body.content, req); return successResponse(res, 200, `${req.params.type} updated.`); } catch (e) { next(e); } };
exports.setMaintenanceMode = async (req, res, next) => { try { await svc.setMaintenanceMode(req.user._id, req.body.enabled, req); return successResponse(res, 200, `Maintenance ${req.body.enabled ? 'enabled' : 'disabled'}.`); } catch (e) { next(e); } };

// Notifications
exports.getNotifications = async (req, res, next) => { try { const Notification = require('../notification/notification.model'); const paginate = require('../../utils/paginate'); const result = await paginate(Notification, { user: req.user._id }, { page: req.query.page, limit: req.query.limit || 20, sort: { createdAt: -1 } }); return successResponse(res, 200, 'Notifications.', result); } catch (e) { next(e); } };
exports.markAllNotificationsRead = async (req, res, next) => { try { const Notification = require('../notification/notification.model'); await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true }); return successResponse(res, 200, 'All read.'); } catch (e) { next(e); } };

// Reports
exports.getReports = async (req, res, next) => { try { return successResponse(res, 200, 'Reports.', await svc.getReports(req.query)); } catch (e) { next(e); } };