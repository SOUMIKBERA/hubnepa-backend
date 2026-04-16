const userService = require('./user.service');
const { successResponse, errorResponse } = require('../../utils/apiResponse');

const getProfile = async (req, res, next) => {
  try {
    const user = await userService.getProfile(req.user._id);
    return successResponse(res, 200, 'Profile fetched.', { user });
  } catch (error) { next(error); }
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await userService.updateProfile(req.user._id, req.body);
    return successResponse(res, 200, 'Profile updated.', { user });
  } catch (error) { next(error); }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await userService.changePassword(req.user._id, currentPassword, newPassword);
    return successResponse(res, 200, 'Password changed successfully.');
  } catch (error) { next(error); }
};

const addAddress = async (req, res, next) => {
  try {
    const addresses = await userService.addAddress(req.user._id, req.body);
    return successResponse(res, 201, 'Address added.', { addresses });
  } catch (error) { next(error); }
};

const updateAddress = async (req, res, next) => {
  try {
    const addresses = await userService.updateAddress(req.user._id, req.params.id, req.body);
    return successResponse(res, 200, 'Address updated.', { addresses });
  } catch (error) { next(error); }
};

const deleteAddress = async (req, res, next) => {
  try {
    const addresses = await userService.deleteAddress(req.user._id, req.params.id);
    return successResponse(res, 200, 'Address deleted.', { addresses });
  } catch (error) { next(error); }
};

const getNotifications = async (req, res, next) => {
  try {
    const result = await userService.getNotifications(req.user._id, req.query);
    return successResponse(res, 200, 'Notifications fetched.', result);
  } catch (error) { next(error); }
};

const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await userService.markNotificationRead(req.user._id, req.params.id);
    return successResponse(res, 200, 'Notification marked as read.', { notification });
  } catch (error) { next(error); }
};

const markAllNotificationsRead = async (req, res, next) => {
  try {
    await userService.markAllNotificationsRead(req.user._id);
    return successResponse(res, 200, 'All notifications marked as read.');
  } catch (error) { next(error); }
};

const updatePreferences = async (req, res, next) => {
  try {
    const User = require('../auth/auth.model');
    const allowed = ['language', 'currency', 'darkMode', 'notifications'];
    const update = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) update[`preferences.${k}`] = req.body[k]; });
    const user = await User.findByIdAndUpdate(req.user._id, { $set: update }, { new: true }).select('-password -refreshToken');
    return successResponse(res, 200, 'Preferences updated.', { user });
  } catch (error) { next(error); }
};

const deleteAccount = async (req, res, next) => {
  try {
    const User = require('../auth/auth.model');
    await User.findByIdAndUpdate(req.user._id, { isActive: false });
    return successResponse(res, 200, 'Account deactivated successfully.');
  } catch (error) { next(error); }
};

module.exports = {
  getProfile, updateProfile, changePassword,
  addAddress, updateAddress, deleteAddress,
  getNotifications, markNotificationRead, markAllNotificationsRead,
  updatePreferences, deleteAccount,
};