const User = require('../auth/auth.model');
const Notification = require('../notification/notification.model');
const bcrypt = require('bcryptjs');
const paginate = require('../../utils/paginate');

const getProfile = async (userId) => {
  const user = await User.findById(userId).select('-password -refreshToken -resetPasswordToken -resetPasswordExpire');
  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }
  return user;
};

const updateProfile = async (userId, updateData) => {
  const allowedFields = ['firstName', 'lastName', 'phone', 'avatar'];
  const filteredData = {};
  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) filteredData[field] = updateData[field];
  });

  const user = await User.findByIdAndUpdate(userId, filteredData, {
    new: true,
    runValidators: true,
  }).select('-password -refreshToken');

  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }
  return user;
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

  if (user.authProvider === 'google') {
    const err = new Error('Google accounts cannot change password.');
    err.statusCode = 400;
    throw err;
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    const err = new Error('Current password is incorrect.');
    err.statusCode = 400;
    throw err;
  }

  user.password = newPassword;
  await user.save();
  return true;
};

const addAddress = async (userId, addressData) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

  // If this is set as default, remove default from others
  if (addressData.isDefault) {
    user.addresses.forEach((addr) => { addr.isDefault = false; });
  }

  // If first address, make it default
  if (user.addresses.length === 0) addressData.isDefault = true;

  user.addresses.push(addressData);
  await user.save();

  return user.addresses;
};

const updateAddress = async (userId, addressId, updateData) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

  const address = user.addresses.id(addressId);
  if (!address) {
    const err = new Error('Address not found.');
    err.statusCode = 404;
    throw err;
  }

  if (updateData.isDefault) {
    user.addresses.forEach((addr) => { addr.isDefault = false; });
  }

  Object.assign(address, updateData);
  await user.save();

  return user.addresses;
};

const deleteAddress = async (userId, addressId) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

  const address = user.addresses.id(addressId);
  if (!address) {
    const err = new Error('Address not found.');
    err.statusCode = 404;
    throw err;
  }

  address.deleteOne();
  await user.save();

  return user.addresses;
};

const getNotifications = async (userId, query) => {
  const filter = { user: userId };
  if (query.type) filter.type = query.type;
  if (query.isRead !== undefined) filter.isRead = query.isRead === 'true';

  return await paginate(Notification, filter, {
    page: query.page,
    limit: query.limit,
    sort: { createdAt: -1 },
  });
};

const markNotificationRead = async (userId, notificationId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { isRead: true },
    { new: true }
  );
  if (!notification) {
    const err = new Error('Notification not found.');
    err.statusCode = 404;
    throw err;
  }
  return notification;
};

const markAllNotificationsRead = async (userId) => {
  await Notification.updateMany({ user: userId, isRead: false }, { isRead: true });
  return true;
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  addAddress,
  updateAddress,
  deleteAddress,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};