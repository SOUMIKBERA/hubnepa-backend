const { DeliveryProfile, EarningsLog } = require('./delivery-panel.model');
const Order = require('../order/order.model');
const User = require('../auth/auth.model');
const Notification = require('../notification/notification.model');
const paginate = require('../../utils/paginate');
const mongoose = require('mongoose');

const getOrCreateProfile = async (driverId) => {
  let profile = await DeliveryProfile.findOne({ driver: driverId });
  if (!profile) profile = await DeliveryProfile.create({ driver: driverId });
  return profile;
};

const getProfile = async (driverId) => {
  const [profile, user] = await Promise.all([
    getOrCreateProfile(driverId),
    User.findById(driverId).select('-password -refreshToken'),
  ]);
  return { profile, user };
};

const updateProfile = async (driverId, data) => {
  const profileFields = ['vehicleType', 'vehicleNumber', 'vehicleModel', 'bankDetails', 'documents', 'preferredZones'];
  const profileUpdate = {};
  profileFields.forEach((k) => { if (data[k] !== undefined) profileUpdate[k] = data[k]; });
  const userFields = ['firstName', 'lastName', 'phone', 'avatar'];
  const userUpdate = {};
  userFields.forEach((k) => { if (data[k] !== undefined) userUpdate[k] = data[k]; });

  const [profile] = await Promise.all([
    DeliveryProfile.findOneAndUpdate({ driver: driverId }, profileUpdate, { new: true, upsert: true }),
    Object.keys(userUpdate).length ? User.findByIdAndUpdate(driverId, userUpdate) : Promise.resolve(),
  ]);
  return profile;
};

const toggleStatus = async (driverId, isOnline, location) => {
  const update = { isOnline, lastActiveAt: new Date() };
  if (location) update.currentLocation = { ...location, updatedAt: new Date() };
  const profile = await DeliveryProfile.findOneAndUpdate({ driver: driverId }, update, { new: true, upsert: true });
  return profile;
};

const updateLocation = async (driverId, lat, lng, address) => {
  const profile = await DeliveryProfile.findOneAndUpdate(
    { driver: driverId },
    { currentLocation: { lat, lng, address, updatedAt: new Date() } },
    { new: true, upsert: true }
  );
  return profile;
};

const getAvailableOrders = async (query) => {
  return paginate(Order, { status: 'ready', deliveryPartner: null }, {
    page: query.page, limit: query.limit || 10, sort: { createdAt: 1 },
    populate: [
      { path: 'restaurant', select: 'name address phone' },
      { path: 'customer', select: 'firstName lastName phone' },
    ],
  });
};

const acceptOrder = async (driverId, orderId) => {
  const order = await Order.findOneAndUpdate(
    { _id: orderId, status: 'ready', deliveryPartner: null },
    { deliveryPartner: driverId, status: 'picked_up', $push: { statusHistory: { status: 'picked_up', timestamp: new Date(), note: 'Driver assigned' } } },
    { new: true }
  ).populate('customer', 'firstName lastName phone').populate('restaurant', 'name address phone');
  if (!order) { const e = new Error('Order no longer available or already assigned.'); e.statusCode = 400; throw e; }
  await Notification.create({ user: order.customer, title: 'Driver On The Way!', message: `Your order #${order.orderId} has been picked up and is on the way!`, type: 'order_update', metadata: { orderId: order._id } });
  return order;
};

const updateOrderStatus = async (driverId, orderId, status) => {
  const validStatuses = ['in_transit', 'delivered'];
  if (!validStatuses.includes(status)) { const e = new Error('Invalid status for delivery.'); e.statusCode = 400; throw e; }

  const updateData = { status, $push: { statusHistory: { status, timestamp: new Date() } } };
  if (status === 'delivered') {
    updateData.deliveredAt = new Date();
    updateData.paymentStatus = 'paid';
  }

  const order = await Order.findOneAndUpdate({ _id: orderId, deliveryPartner: driverId }, updateData, { new: true });
  if (!order) { const e = new Error('Order not found or not assigned to you.'); e.statusCode = 404; throw e; }

  if (status === 'delivered') {
    const earningAmount = order.deliveryFee || 3.50;
    const today = new Date(); today.setHours(0, 0, 0, 0);

    await Promise.all([
      DeliveryProfile.findOneAndUpdate(
        { driver: driverId },
        { $inc: { totalDeliveries: 1, totalEarnings: earningAmount, todayEarnings: earningAmount, weekEarnings: earningAmount, monthEarnings: earningAmount } },
        { upsert: true }
      ),
      EarningsLog.create({ driver: driverId, order: orderId, amount: earningAmount, type: 'delivery_fee', description: `Delivery fee for order #${order.orderId}`, status: 'paid' }),
      Notification.create({ user: order.customer, title: 'Order Delivered!', message: `Your order #${order.orderId} has been delivered. Enjoy!`, type: 'order_update' }),
    ]);
  }

  if (status === 'in_transit') {
    await Notification.create({ user: order.customer, title: 'Order On The Way', message: `Your driver is on the way with order #${order.orderId}!`, type: 'order_update' });
  }
  return order;
};

const getMyDeliveries = async (driverId, query) => {
  const filter = { deliveryPartner: driverId };
  if (query.status) filter.status = query.status;
  if (query.active === 'true') filter.status = { $in: ['picked_up', 'in_transit'] };
  return paginate(Order, filter, {
    page: query.page, limit: query.limit || 10, sort: { updatedAt: -1 },
    populate: [
      { path: 'customer', select: 'firstName lastName phone' },
      { path: 'restaurant', select: 'name address' },
    ],
  });
};

const getEarnings = async (driverId, query) => {
  const profile = await getOrCreateProfile(driverId);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [todayStats, weekStats, monthStats, recentEarnings, weeklyBreakdown] = await Promise.all([
    Order.aggregate([{ $match: { deliveryPartner: mongoose.Types.ObjectId(driverId), status: 'delivered', deliveredAt: { $gte: today } } }, { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$deliveryFee' } } }]),
    Order.aggregate([{ $match: { deliveryPartner: mongoose.Types.ObjectId(driverId), status: 'delivered', deliveredAt: { $gte: weekStart } } }, { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$deliveryFee' } } }]),
    Order.aggregate([{ $match: { deliveryPartner: mongoose.Types.ObjectId(driverId), status: 'delivered', deliveredAt: { $gte: monthStart } } }, { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$deliveryFee' } } }]),
    EarningsLog.find({ driver: driverId }).sort({ createdAt: -1 }).limit(20).populate('order', 'orderId'),
    EarningsLog.aggregate([
      { $match: { driver: mongoose.Types.ObjectId(driverId), createdAt: { $gte: weekStart } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { '_id': 1 } },
    ]),
  ]);

  return {
    totalEarnings: profile.totalEarnings,
    totalDeliveries: profile.totalDeliveries,
    rating: profile.rating,
    today: { deliveries: todayStats[0]?.count || 0, earnings: todayStats[0]?.total || 0 },
    week: { deliveries: weekStats[0]?.count || 0, earnings: weekStats[0]?.total || 0 },
    month: { deliveries: monthStats[0]?.count || 0, earnings: monthStats[0]?.total || 0 },
    recentEarnings,
    weeklyBreakdown,
  };
};

const requestPayout = async (driverId, amount) => {
  const profile = await getOrCreateProfile(driverId);
  if ((profile.totalEarnings || 0) < amount) { const e = new Error('Insufficient earnings balance.'); e.statusCode = 400; throw e; }
  await EarningsLog.create({ driver: driverId, amount: -amount, type: 'payout', description: 'Payout request', status: 'pending' });
  return { amount, status: 'Processing', estimatedDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) };
};

const getDeliveryHistory = async (driverId, query) => {
  return paginate(Order, { deliveryPartner: driverId, status: 'delivered' }, {
    page: query.page, limit: query.limit || 10, sort: { deliveredAt: -1 },
    populate: [{ path: 'customer', select: 'firstName lastName' }, { path: 'restaurant', select: 'name' }],
  });
};

module.exports = { getProfile, updateProfile, toggleStatus, updateLocation, getAvailableOrders, acceptOrder, updateOrderStatus, getMyDeliveries, getEarnings, requestPayout, getDeliveryHistory };