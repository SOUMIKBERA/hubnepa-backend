const supportService = require('./support.service');
const { successResponse } = require('../../utils/apiResponse');

exports.createTicket = async (req, res, next) => {
  try {
    const ticket = await supportService.createTicket(req.user._id, req.body);
    return successResponse(res, 201, 'Ticket created. We will respond within 2 hours.', { ticket });
  } catch (e) { next(e); }
};

exports.getMyTickets = async (req, res, next) => {
  try {
    const result = await supportService.getMyTickets(req.user._id, req.query);
    return successResponse(res, 200, 'Tickets fetched.', result);
  } catch (e) { next(e); }
};

exports.getTicketById = async (req, res, next) => {
  try {
    const ticket = await supportService.getTicketById(req.params.id, req.user._id, req.user.role);
    return successResponse(res, 200, 'Ticket fetched.', { ticket });
  } catch (e) { next(e); }
};

exports.replyToTicket = async (req, res, next) => {
  try {
    const role = req.user.role === 'admin' ? 'admin' : 'user';
    const ticket = await supportService.replyToTicket(req.params.id, req.user._id, role, req.body.message);
    return successResponse(res, 200, 'Reply sent.', { ticket });
  } catch (e) { next(e); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const ticket = await supportService.updateTicketStatus(req.params.id, req.body.status, req.user._id);
    return successResponse(res, 200, 'Ticket status updated.', { ticket });
  } catch (e) { next(e); }
};

exports.rateTicket = async (req, res, next) => {
  try {
    const ticket = await supportService.rateTicket(req.params.id, req.user._id, req.body.rating, req.body.comment);
    return successResponse(res, 200, 'Ticket rated. Thank you!', { ticket });
  } catch (e) { next(e); }
};

exports.getAllTickets = async (req, res, next) => {
  try {
    const result = await supportService.getAllTickets(req.query);
    return successResponse(res, 200, 'All tickets fetched.', result);
  } catch (e) { next(e); }
};