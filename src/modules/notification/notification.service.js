const Notification = require('./notification.model');
const paginate = require('../../utils/paginate');

const getNotifications = async (userId, query) => {
  const filter = { user: userId };
  if (query.type) filter.type = query.type;
  if (query.isRead !== undefined) filter.isRead = query.isRead === 'true';
  const result = await paginate(Notification, filter, {
    page: query.page, limit: query.limit || 20, sort: { createdAt: -1 },
  });
  const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });
  return { ...result, unreadCount };
};

const markOneRead = async (notificationId, userId) => {
  const n = await Notification.findOneAndUpdate({ _id: notificationId, user: userId }, { isRead: true }, { new: true });
  if (!n) { const e = new Error('Notification not found.'); e.statusCode = 404; throw e; }
  return n;
};

const markAllRead = async (userId) => {
  await Notification.updateMany({ user: userId, isRead: false }, { isRead: true });
};

const deleteOne = async (notificationId, userId) => {
  await Notification.findOneAndDelete({ _id: notificationId, user: userId });
};

const clearAll = async (userId) => {
  await Notification.deleteMany({ user: userId });
};

const createNotification = async (userId, title, message, type = 'system', metadata = {}) => {
  return Notification.create({ user: userId, title, message, type, metadata });
};

module.exports = { getNotifications, markOneRead, markAllRead, deleteOne, clearAll, createNotification };