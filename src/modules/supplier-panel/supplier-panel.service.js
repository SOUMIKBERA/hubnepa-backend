const { SupplierProduct, WholesaleOrder, SupplierClient, WarehouseZone, WarehouseItem, Shipment, SupplierInvoice } = require('./supplier-panel.model');
const Notification = require('../notification/notification.model');
const User = require('../auth/auth.model');
const paginate = require('../../utils/paginate');
const mongoose = require('mongoose');

// ─── Dashboard ─────
const getDashboard = async (supplierId) => {
  const sid = mongoose.Types.ObjectId(supplierId);
  const [totalRevenue, activeOrders, lowStock, activeClients, recentOrders, lowStockItems] = await Promise.all([
    WholesaleOrder.aggregate([{ $match: { supplier: sid, status: 'Delivered' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
    WholesaleOrder.countDocuments({ supplier: supplierId, status: { $in: ['Pending', 'Confirmed', 'Processing', 'Shipped'] } }),
    SupplierProduct.countDocuments({ supplier: supplierId, status: { $in: ['Low Stock', 'Out of Stock'] } }),
    SupplierClient.countDocuments({ supplier: supplierId, status: 'Active' }),
    WholesaleOrder.find({ supplier: supplierId }).sort({ createdAt: -1 }).limit(5).populate('client', 'firstName lastName'),
    SupplierProduct.find({ supplier: supplierId, status: { $in: ['Low Stock', 'Out of Stock'] } }).limit(5),
  ]);
  return { totalRevenue: totalRevenue[0]?.total || 0, activeOrders, lowStock, activeClients, recentOrders, lowStockItems };
};

// ─── Products ─────
const getProducts = async (supplierId, query) => {
  const filter = { supplier: supplierId };
  if (query.category) filter.category = query.category;
  if (query.status) filter.status = query.status;
  if (query.search) filter.productName = new RegExp(query.search, 'i');
  return paginate(SupplierProduct, filter, { page: query.page, limit: query.limit, sort: { createdAt: -1 } });
};

const createProduct = async (supplierId, data) => {
  return SupplierProduct.create({ ...data, supplier: supplierId, currentStock: data.initialStock || 0 });
};

const updateProduct = async (supplierId, productId, data) => {
  const p = await SupplierProduct.findOneAndUpdate({ _id: productId, supplier: supplierId }, data, { new: true, runValidators: true });
  if (!p) { const e = new Error('Product not found.'); e.statusCode = 404; throw e; }
  return p;
};

const deleteProduct = async (supplierId, productId) => {
  await SupplierProduct.findOneAndDelete({ _id: productId, supplier: supplierId });
};

// ─── Orders ─────
const getOrders = async (supplierId, query) => {
  const filter = { supplier: supplierId };
  if (query.status) filter.status = query.status;
  if (query.search) filter.$or = [{ orderId: new RegExp(query.search, 'i') }, { clientName: new RegExp(query.search, 'i') }];
  return paginate(WholesaleOrder, filter, { page: query.page, limit: query.limit, sort: { createdAt: -1 }, populate: { path: 'client', select: 'firstName lastName email' } });
};

const updateOrderStatus = async (supplierId, orderId, status) => {
  const order = await WholesaleOrder.findOneAndUpdate({ _id: orderId, supplier: supplierId }, { status, ...(status === 'Delivered' ? { deliveredAt: new Date() } : {}) }, { new: true });
  if (!order) { const e = new Error('Order not found.'); e.statusCode = 404; throw e; }
  return order;
};

const createManifest = async (supplierId, orderIds, shipmentData) => {
  const orders = await WholesaleOrder.find({ _id: { $in: orderIds }, supplier: supplierId });
  const shipments = await Promise.all(orders.map((o) =>
    Shipment.create({ supplier: supplierId, order: o._id, client: o.client, clientName: o.clientName, ...shipmentData, status: 'Loading', items: o.items.map((i) => ({ productName: i.productName, quantity: i.quantity, unit: 'units' })) })
  ));
  return shipments;
};

// ─── Warehouse ──────
const getWarehouseZones = async (supplierId) => {
  return WarehouseZone.find({ supplier: supplierId });
};

const createZone = async (supplierId, data) => {
  return WarehouseZone.create({ ...data, supplier: supplierId });
};

const updateZone = async (supplierId, zoneId, data) => {
  return WarehouseZone.findOneAndUpdate({ _id: zoneId, supplier: supplierId }, data, { new: true });
};

const getWarehouseItems = async (supplierId, query) => {
  const filter = { supplier: supplierId };
  if (query.status) filter.status = query.status;
  if (query.search) filter.binLocation = new RegExp(query.search, 'i');
  return paginate(WarehouseItem, filter, { page: query.page, limit: query.limit, populate: { path: 'product', select: 'productName sku' } });
};

const adjustStock = async (supplierId, data) => {
  const { productId, adjustmentType, quantity, binLocation, reason } = data;
  let item = await WarehouseItem.findOne({ supplier: supplierId, product: productId });
  if (!item) item = await WarehouseItem.create({ supplier: supplierId, product: productId, binLocation: binLocation || 'TBD', onHand: 0, allocated: 0 });
  if (adjustmentType === 'Stock In' || adjustmentType === 'Add Stock') item.onHand += Number(quantity);
  else if (adjustmentType === 'Remove Stock' || adjustmentType === 'Loss/Damage') item.onHand = Math.max(0, item.onHand - Number(quantity));
  else if (adjustmentType === 'Correction') item.onHand = Number(quantity);
  item.lastMoved = new Date();
  await item.save();
  // Update SupplierProduct stock too
  await SupplierProduct.findByIdAndUpdate(productId, { currentStock: item.onHand });
  return item;
};

// ─── Clients ───────
const getClients = async (supplierId, query) => {
  const filter = { supplier: supplierId };
  if (query.type) filter.clientType = query.type;
  if (query.status) filter.status = query.status;
  if (query.search) filter.$or = [{ clientName: new RegExp(query.search, 'i') }, { email: new RegExp(query.search, 'i') }];
  return paginate(SupplierClient, filter, { page: query.page, limit: query.limit, sort: { totalSpend: -1 } });
};

const createClient = async (supplierId, data) => {
  return SupplierClient.create({ ...data, supplier: supplierId });
};

const updateClient = async (supplierId, clientId, data) => {
  return SupplierClient.findOneAndUpdate({ _id: clientId, supplier: supplierId }, data, { new: true });
};

const broadcastToClients = async (supplierId, targetAudience, subject, message) => {
  const filter = { supplier: supplierId };
  if (targetAudience !== 'All Clients') filter.clientType = targetAudience;
  const clients = await SupplierClient.find(filter).select('email clientName client');
  const notifications = clients.filter(c => c.client).map(c => ({ user: c.client, title: subject, message, type: 'system' }));
  if (notifications.length) await Notification.insertMany(notifications);
  return { recipientCount: clients.length };
};

// ─── Logistics ─────
const getShipments = async (supplierId, query) => {
  const filter = { supplier: supplierId };
  if (query.status) filter.status = query.status;
  if (query.search) filter.$or = [{ shipmentId: new RegExp(query.search, 'i') }, { clientName: new RegExp(query.search, 'i') }];
  return paginate(Shipment, filter, { page: query.page, limit: query.limit, sort: { createdAt: -1 } });
};

const createShipment = async (supplierId, data) => {
  return Shipment.create({ ...data, supplier: supplierId });
};

const updateShipment = async (supplierId, shipmentId, data) => {
  const s = await Shipment.findOneAndUpdate({ _id: shipmentId, supplier: supplierId }, { ...data, ...(data.status === 'Delivered' ? { deliveredAt: new Date() } : {}) }, { new: true });
  if (!s) { const e = new Error('Shipment not found.'); e.statusCode = 404; throw e; }
  return s;
};

// ─── Finance ─────
const getFinanceOverview = async (supplierId) => {
  const sid = mongoose.Types.ObjectId(supplierId);
  const [totalRevenue, pendingPayments, paidThisMonth, invoices, transactions] = await Promise.all([
    WholesaleOrder.aggregate([{ $match: { supplier: sid, paymentStatus: { $in: ['Paid', 'Net 30'] } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
    WholesaleOrder.aggregate([{ $match: { supplier: sid, paymentStatus: 'Unpaid' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
    WholesaleOrder.aggregate([{ $match: { supplier: sid, paymentStatus: 'Paid', updatedAt: { $gte: new Date(new Date().setDate(1)) } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
    SupplierInvoice.find({ supplier: supplierId }).sort({ createdAt: -1 }).limit(10).populate('client', 'firstName lastName'),
    WholesaleOrder.find({ supplier: supplierId, status: 'Delivered' }).sort({ createdAt: -1 }).limit(10).select('orderId totalAmount paymentStatus createdAt clientName'),
  ]);
  return { totalRevenue: totalRevenue[0]?.total || 0, pendingPayments: pendingPayments[0]?.total || 0, paidThisMonth: paidThisMonth[0]?.total || 0, invoices, transactions };
};

const getInvoices = async (supplierId, query) => {
  return paginate(SupplierInvoice, { supplier: supplierId }, { page: query.page, limit: query.limit, sort: { createdAt: -1 }, populate: { path: 'client', select: 'firstName lastName email' } });
};

const createInvoice = async (supplierId, data) => {
  return SupplierInvoice.create({ ...data, supplier: supplierId });
};

const updateInvoice = async (supplierId, invoiceId, data) => {
  return SupplierInvoice.findOneAndUpdate({ _id: invoiceId, supplier: supplierId }, data, { new: true });
};

const requestPayout = async (supplierId, amount) => {
  return { amount, status: 'Processing', estimatedDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) };
};

// ─── Reports ──────
const getReports = async (supplierId, query) => {
  const sid = mongoose.Types.ObjectId(supplierId);
  const days = parseInt(query.days) || 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [revenueByDay, topProducts, topClients, categoryBreakdown, orderStats] = await Promise.all([
    WholesaleOrder.aggregate([{ $match: { supplier: sid, createdAt: { $gte: since } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 } } }, { $sort: { '_id': 1 } }]),
    WholesaleOrder.aggregate([{ $match: { supplier: sid } }, { $unwind: '$items' }, { $group: { _id: '$items.productName', units: { $sum: '$items.quantity' }, revenue: { $sum: '$items.subtotal' } } }, { $sort: { revenue: -1 } }, { $limit: 5 }]),
    WholesaleOrder.aggregate([{ $match: { supplier: sid } }, { $group: { _id: '$client', totalRevenue: { $sum: '$totalAmount' }, orders: { $sum: 1 }, clientName: { $first: '$clientName' } } }, { $sort: { totalRevenue: -1 } }, { $limit: 5 }]),
    SupplierProduct.aggregate([{ $match: { supplier: sid } }, { $group: { _id: '$category', count: { $sum: 1 }, stock: { $sum: '$currentStock' } } }]),
    WholesaleOrder.aggregate([{ $match: { supplier: sid } }, { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } }]),
  ]);
  return { revenueByDay, topProducts, topClients, categoryBreakdown, orderStats };
};

// ─── Settings ─────
const getSettings = async (supplierId) => {
  const user = await User.findById(supplierId).select('-password -refreshToken');
  return { user };
};

const updateSettings = async (supplierId, data) => {
  const allowed = ['firstName', 'lastName', 'phone', 'avatar'];
  const update = {};
  allowed.forEach(k => { if (data[k] !== undefined) update[k] = data[k]; });
  const user = await User.findByIdAndUpdate(supplierId, update, { new: true }).select('-password -refreshToken');
  return { user };
};

module.exports = { getDashboard, getProducts, createProduct, updateProduct, deleteProduct, getOrders, updateOrderStatus, createManifest, getWarehouseZones, createZone, updateZone, getWarehouseItems, adjustStock, getClients, createClient, updateClient, broadcastToClients, getShipments, createShipment, updateShipment, getFinanceOverview, getInvoices, createInvoice, updateInvoice, requestPayout, getReports, getSettings, updateSettings };