const express = require('express');
const router = express.Router();
const ctrl = require('./support.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const { validate, schemas } = require('../../middlewares/validate.middleware');

router.use(protect);

// Customer routes
router.post('/', validate(schemas.ticket), ctrl.createTicket);
router.get('/', ctrl.getMyTickets);
router.get('/:id', ctrl.getTicketById);
router.post('/:id/reply', ctrl.replyToTicket);
router.put('/:id/rate', ctrl.rateTicket);

// Admin routes
router.get('/admin/all', authorize('admin'), ctrl.getAllTickets);
router.put('/admin/:id/status', authorize('admin'), ctrl.updateStatus);

module.exports = router;