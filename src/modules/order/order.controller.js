const orderService = require('./order.service');
const { successResponse } = require('../../utils/apiResponse');

const placeOrder = async (req, res, next) => {
  try {
    const order = await orderService.placeOrder(req.user._id, req.body);
    return successResponse(res, 201, 'Order placed successfully.', { order });
  } catch (error) { next(error); }
};

const getMyOrders = async (req, res, next) => {
  try {
    const result = await orderService.getMyOrders(req.user._id, req.query);
    return successResponse(res, 200, 'Orders fetched.', result);
  } catch (error) { next(error); }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.user._id, req.params.id);
    return successResponse(res, 200, 'Order fetched.', { order });
  } catch (error) { next(error); }
};

const cancelOrder = async (req, res, next) => {
  try {
    const order = await orderService.cancelOrder(req.user._id, req.params.id, req.body.reason);
    return successResponse(res, 200, 'Order cancelled.', { order });
  } catch (error) { next(error); }
};

const requestRefund = async (req, res, next) => {
  try {
    const order = await orderService.requestRefund(req.user._id, req.params.id, req.body.reason);
    return successResponse(res, 200, 'Refund requested.', { order });
  } catch (error) { next(error); }
};

const reorder = async (req, res, next) => {
  try {
    const result = await orderService.reorder(req.user._id, req.params.id);
    return successResponse(res, 200, result.message);
  } catch (error) { next(error); }
};

// Restaurant panel
const getRestaurantOrders = async (req, res, next) => {
  try {
    const restaurant = await require('../restaurant/restaurant.model').findOne({ owner: req.user._id });
    if (!restaurant) return successResponse(res, 404, 'Restaurant not found.', {});
    const result = await orderService.getRestaurantOrders(restaurant._id, req.query);
    return successResponse(res, 200, 'Orders fetched.', result);
  } catch (error) { next(error); }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await orderService.updateOrderStatus(req.user._id, req.params.id, req.body.status, req.body.note);
    return successResponse(res, 200, 'Order status updated.', { order });
  } catch (error) { next(error); }
};

// Retailer panel
const getRetailerOrders = async (req, res, next) => {
  try {
    const result = await orderService.getRetailerOrders(req.user._id, req.query);
    return successResponse(res, 200, 'Orders fetched.', result);
  } catch (error) { next(error); }
};

module.exports = {
  placeOrder, getMyOrders, getOrderById, cancelOrder,
  requestRefund, reorder, getRestaurantOrders,
  updateOrderStatus, getRetailerOrders,
};