const Ticket = require('./support.model');
const Notification = require('../notification/notification.model');
const paginate = require('../../utils/paginate');

const createTicket = async (userId, data) => {
  const ticket = await Ticket.create({
    user: userId,
    subject: data.subject,
    category: data.category,
    priority: data.priority || 'Medium',
    orderId: data.orderId || null,
    messages: [{ sender: userId, senderRole: 'user', message: data.message }],
    tags: data.tags || [],
  });
  await Notification.create({ user: userId, title: 'Support Ticket Created', message: `Ticket #${ticket.ticketId} has been created. We'll respond within 2 hours.`, type: 'system' });
  return ticket;
};

const getMyTickets = async (userId, query) => {
  const filter = { user: userId };
  if (query.status) filter.status = query.status;
  if (query.category) filter.category = query.category;
  return paginate(Ticket, filter, { page: query.page, limit: query.limit, sort: { updatedAt: -1 } });
};

const getTicketById = async (ticketId, userId, role) => {
  const query = role === 'admin' ? { _id: ticketId } : { _id: ticketId, user: userId };
  const ticket = await Ticket.findOne(query).populate('user', 'firstName lastName email').populate('assignedTo', 'firstName lastName').populate('messages.sender', 'firstName lastName avatar role');
  if (!ticket) { const e = new Error('Ticket not found.'); e.statusCode = 404; throw e; }
  return ticket;
};

const replyToTicket = async (ticketId, senderId, senderRole, message) => {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) { const e = new Error('Ticket not found.'); e.statusCode = 404; throw e; }
  ticket.messages.push({ sender: senderId, senderRole, message });
  ticket.lastReplyAt = new Date();
  if (senderRole === 'admin' || senderRole === 'support') {
    ticket.status = 'In Progress';
    await Notification.create({ user: ticket.user, title: 'Support Reply', message: `Your ticket #${ticket.ticketId} has a new reply.`, type: 'system' });
  }
  await ticket.save();
  return ticket;
};

const updateTicketStatus = async (ticketId, status, adminId) => {
  const ticket = await Ticket.findByIdAndUpdate(ticketId, {
    status,
    ...(status === 'Resolved' ? { resolvedAt: new Date() } : {}),
    ...(adminId ? { assignedTo: adminId } : {}),
  }, { new: true });
  if (!ticket) { const e = new Error('Ticket not found.'); e.statusCode = 404; throw e; }
  if (status === 'Resolved') await Notification.create({ user: ticket.user, title: 'Ticket Resolved', message: `Your support ticket #${ticket.ticketId} has been resolved.`, type: 'system' });
  return ticket;
};

const rateTicket = async (ticketId, userId, rating, comment) => {
  const ticket = await Ticket.findOneAndUpdate({ _id: ticketId, user: userId, status: 'Resolved' }, { rating: { value: rating, comment } }, { new: true });
  if (!ticket) { const e = new Error('Ticket not found or not resolved.'); e.statusCode = 404; throw e; }
  return ticket;
};

// Admin - all tickets
const getAllTickets = async (query) => {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.category) filter.category = query.category;
  if (query.search) filter.$or = [{ ticketId: new RegExp(query.search, 'i') }, { subject: new RegExp(query.search, 'i') }];
  return paginate(Ticket, filter, {
    page: query.page, limit: query.limit, sort: { priority: -1, createdAt: -1 },
    populate: [{ path: 'user', select: 'firstName lastName email role' }, { path: 'assignedTo', select: 'firstName lastName' }],
  });
};

module.exports = { createTicket, getMyTickets, getTicketById, replyToTicket, updateTicketStatus, rateTicket, getAllTickets };