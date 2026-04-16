const Order = require('./order.model');
const Cart = require('../cart/cart.model');
const User = require('../auth/auth.model');
const Notification = require('../notification/notification.model');
const paginate = require('../../utils/paginate');

const placeOrder = async (userId, orderData) => {
  const { deliveryAddress, scheduledDelivery, paymentMethod, voucher, notes, isContactless } = orderData;

  const cart = await Cart.findOne({ user: userId }).populate('items.product');
  if (!cart || cart.items.length === 0) {
    const err = new Error('Your cart is empty.'); err.statusCode = 400; throw err;
  }

  const user = await User.findById(userId);
  const subtotal = cart.subtotal;
  const deliveryFee = cart.restaurantId ? 2.99 : 5.99;
  const tax = parseFloat((subtotal * 0.08).toFixed(2));
  let discount = 0;

  // Apply voucher
  if (voucher) {
    const Voucher = require('../payment/voucher.model');
    const v = await Voucher.findOne({ code: voucher, isActive: true, expiresAt: { $gt: new Date() } });
    if (v) {
      discount = v.discountType === 'percentage' ? (subtotal * v.discountValue / 100) : v.discountValue;
      v.usedCount += 1;
      await v.save();
    }
  }

  const isFreeDelivery = subtotal >= 50;
  const finalDelivery = isFreeDelivery ? 0 : deliveryFee;
  const total = parseFloat((subtotal + finalDelivery + tax - discount).toFixed(2));

  // Wallet payment check
  if (paymentMethod === 'wallet') {
    if (user.walletBalance < total) {
      const err = new Error('Insufficient wallet balance.'); err.statusCode = 400; throw err;
    }
    await User.findByIdAndUpdate(userId, { $inc: { walletBalance: -total, rewardPoints: Math.floor(total * 10) } });
  }

  const orderType = cart.restaurantId ? 'food' : 'grocery';
  const items = cart.items.map(i => ({
    itemType: i.itemType, product: i.product || null,
    menuItemId: i.menuItemId || null, name: i.name,
    image: i.image, price: i.price, quantity: i.quantity, subtotal: i.subtotal,
  }));

  const order = await Order.create({
    customer: userId,
    restaurant: cart.restaurantId || null,
    retailer: cart.items[0]?.product?.retailer || null,
    orderType, items, deliveryAddress,
    scheduledDelivery: scheduledDelivery || null,
    paymentMethod,
    paymentStatus: paymentMethod === 'card' ? 'pending' : 'paid',
    subtotal, deliveryFee: finalDelivery, tax, discount, total,
    isContactless: isContactless !== false,
    notes,
    statusHistory: [{ status: 'pending', timestamp: new Date() }],
    estimatedDelivery: new Date(Date.now() + 45 * 60 * 1000),
  });

  await Cart.findOneAndUpdate({ user: userId }, { items: [], restaurantId: null, subtotal: 0, itemCount: 0 });

  // Notify customer
  await Notification.create({
    user: userId, title: 'Order Placed!',
    message: `Your order #${order.orderId} has been placed successfully.`,
    type: 'order_update', metadata: { orderId: order._id },
  });

  return order;
};

const getMyOrders = async (userId, query) => {
  const filter = { customer: userId };
  if (query.type) filter.orderType = query.type;
  if (query.status) filter.status = query.status;
  return await paginate(Order, filter, {
    page: query.page, limit: query.limit, sort: { createdAt: -1 },
    populate: [
      { path: 'restaurant', select: 'name logo' },
      { path: 'retailer', select: 'firstName lastName' },
    ],
  });
};

const getOrderById = async (userId, orderId) => {
  const order = await Order.findOne({ _id: orderId, customer: userId })
    .populate('restaurant', 'name logo phone')
    .populate('deliveryPartner', 'firstName lastName phone');
  if (!order) { const err = new Error('Order not found.'); err.statusCode = 404; throw err; }
  return order;
};

const cancelOrder = async (userId, orderId, reason) => {
  const order = await Order.findOne({ _id: orderId, customer: userId });
  if (!order) { const err = new Error('Order not found.'); err.statusCode = 404; throw err; }
  if (!['pending', 'confirmed'].includes(order.status)) {
    const err = new Error('Order cannot be cancelled at this stage.'); err.statusCode = 400; throw err;
  }
  order.status = 'cancelled';
  order.cancelReason = reason;
  order.cancelledAt = new Date();
  order.statusHistory.push({ status: 'cancelled', note: reason });
  // Refund to wallet if paid
  if (order.paymentStatus === 'paid') {
    await User.findByIdAndUpdate(userId, { $inc: { walletBalance: order.total } });
    order.paymentStatus = 'refunded';
  }
  await order.save();
  return order;
};

const requestRefund = async (userId, orderId, reason) => {
  const order = await Order.findOne({ _id: orderId, customer: userId });
  if (!order) { const err = new Error('Order not found.'); err.statusCode = 404; throw err; }
  if (order.status !== 'delivered') {
    const err = new Error('Refund can only be requested for delivered orders.'); err.statusCode = 400; throw err;
  }
  order.refundStatus = 'requested';
  order.refundAmount = order.total;
  await order.save();
  return order;
};

const reorder = async (userId, orderId) => {
  const order = await Order.findOne({ _id: orderId, customer: userId });
  if (!order) { const err = new Error('Order not found.'); err.statusCode = 404; throw err; }
  const Cart = require('../cart/cart.model');
  await Cart.findOneAndUpdate(
    { user: userId },
    { items: order.items.map(i => ({ ...i.toObject(), _id: undefined })), restaurantId: order.restaurant, subtotal: order.subtotal, itemCount: order.items.reduce((s, i) => s + i.quantity, 0) },
    { upsert: true, new: true }
  );
  return { message: 'Items added to cart.' };
};

// Restaurant order management
const getRestaurantOrders = async (restaurantId, query) => {
  const filter = { restaurant: restaurantId };
  if (query.status) filter.status = query.status;
  return await paginate(Order, filter, {
    page: query.page, limit: query.limit, sort: { createdAt: -1 },
    populate: { path: 'customer', select: 'firstName lastName phone' },
  });
};

const updateOrderStatus = async (actorId, orderId, status, note) => {
  const order = await Order.findById(orderId);
  if (!order) { const err = new Error('Order not found.'); err.statusCode = 404; throw err; }
  order.status = status;
  order.statusHistory.push({ status, note });
  if (status === 'delivered') order.deliveredAt = new Date();
  await order.save();
  // Notify customer
  await Notification.create({
    user: order.customer, title: 'Order Update',
    message: `Your order #${order.orderId} status is now: ${status}.`,
    type: 'order_update', metadata: { orderId: order._id },
  });
  return order;
};

// Retailer order management
const getRetailerOrders = async (retailerId, query) => {
  const filter = { retailer: retailerId };
  if (query.status) filter.status = query.status;
  return await paginate(Order, filter, {
    page: query.page, limit: query.limit, sort: { createdAt: -1 },
    populate: { path: 'customer', select: 'firstName lastName email phone' },
  });
};

module.exports = {
  placeOrder, getMyOrders, getOrderById, cancelOrder,
  requestRefund, reorder, getRestaurantOrders,
  updateOrderStatus, getRetailerOrders,
};