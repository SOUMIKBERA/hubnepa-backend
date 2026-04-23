const deliveryService = require('./delivery-panel.service');
const { successResponse } = require('../../utils/apiResponse');

exports.getProfile = async (req, res, next) => {
  try {
    const data = await deliveryService.getProfile(req.user._id);
    return successResponse(res, 200, 'Profile fetched.', data);
  } catch (e) { next(e); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const profile = await deliveryService.updateProfile(req.user._id, req.body);
    return successResponse(res, 200, 'Profile updated.', { profile });
  } catch (e) { next(e); }
};

exports.toggleStatus = async (req, res, next) => {
  try {
    const { isOnline, location } = req.body;
    const profile = await deliveryService.toggleStatus(req.user._id, isOnline, location);
    return successResponse(res, 200, `You are now ${profile.isOnline ? 'Online' : 'Offline'}.`, { profile });
  } catch (e) { next(e); }
};

exports.updateLocation = async (req, res, next) => {
  try {
    const { lat, lng, address } = req.body;
    if (!lat || !lng) return res.status(422).json({ success: false, message: 'lat and lng are required.' });
    const profile = await deliveryService.updateLocation(req.user._id, lat, lng, address);
    return successResponse(res, 200, 'Location updated.', { location: profile.currentLocation });
  } catch (e) { next(e); }
};

exports.getAvailableOrders = async (req, res, next) => {
  try {
    const result = await deliveryService.getAvailableOrders(req.query);
    return successResponse(res, 200, 'Available orders fetched.', result);
  } catch (e) { next(e); }
};

exports.acceptOrder = async (req, res, next) => {
  try {
    const order = await deliveryService.acceptOrder(req.user._id, req.params.id);
    return successResponse(res, 200, 'Order accepted.', { order });
  } catch (e) { next(e); }
};

exports.declineOrder = async (req, res, next) => {
  try {
    return successResponse(res, 200, 'Order declined.');
  } catch (e) { next(e); }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await deliveryService.updateOrderStatus(req.user._id, req.params.id, status);
    return successResponse(res, 200, 'Order status updated.', { order });
  } catch (e) { next(e); }
};

exports.getMyDeliveries = async (req, res, next) => {
  try {
    const result = await deliveryService.getMyDeliveries(req.user._id, req.query);
    return successResponse(res, 200, 'Deliveries fetched.', result);
  } catch (e) { next(e); }
};

exports.getDeliveryById = async (req, res, next) => {
  try {
    const Order = require('../order/order.model');
    const order = await Order.findOne({ _id: req.params.id, deliveryPartner: req.user._id })
      .populate('customer', 'firstName lastName phone addresses')
      .populate('restaurant', 'name address phone');
    if (!order) return res.status(404).json({ success: false, message: 'Delivery not found.' });
    return successResponse(res, 200, 'Delivery fetched.', { order });
  } catch (e) { next(e); }
};

exports.getEarnings = async (req, res, next) => {
  try {
    const data = await deliveryService.getEarnings(req.user._id, req.query);
    return successResponse(res, 200, 'Earnings fetched.', data);
  } catch (e) { next(e); }
};

exports.requestPayout = async (req, res, next) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(422).json({ success: false, message: 'Valid amount is required.' });
    const result = await deliveryService.requestPayout(req.user._id, parseFloat(amount));
    return successResponse(res, 200, 'Payout request submitted.', result);
  } catch (e) { next(e); }
};

exports.getHistory = async (req, res, next) => {
  try {
    const result = await deliveryService.getDeliveryHistory(req.user._id, req.query);
    return successResponse(res, 200, 'History fetched.', result);
  } catch (e) { next(e); }
};

exports.getSettings = async (req, res, next) => {
  try {
    const data = await deliveryService.getProfile(req.user._id);
    return successResponse(res, 200, 'Settings fetched.', data);
  } catch (e) { next(e); }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const profile = await deliveryService.updateProfile(req.user._id, req.body);
    return successResponse(res, 200, 'Settings updated.', { profile });
  } catch (e) { next(e); }
};