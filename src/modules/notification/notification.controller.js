const notifService = require('./notification.service');
const { successResponse } = require('../../utils/apiResponse');

exports.getNotifications = async (req, res, next) => {
  try {
    const result = await notifService.getNotifications(req.user._id, req.query);
    return successResponse(res, 200, 'Notifications fetched.', result);
  } catch (e) { next(e); }
};

exports.markOneRead = async (req, res, next) => {
  try {
    const n = await notifService.markOneRead(req.params.id, req.user._id);
    return successResponse(res, 200, 'Marked as read.', { notification: n });
  } catch (e) { next(e); }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await notifService.markAllRead(req.user._id);
    return successResponse(res, 200, 'All notifications marked as read.');
  } catch (e) { next(e); }
};

exports.deleteOne = async (req, res, next) => {
  try {
    await notifService.deleteOne(req.params.id, req.user._id);
    return successResponse(res, 200, 'Notification deleted.');
  } catch (e) { next(e); }
};

exports.clearAll = async (req, res, next) => {
  try {
    await notifService.clearAll(req.user._id);
    return successResponse(res, 200, 'All notifications cleared.');
  } catch (e) { next(e); }
};