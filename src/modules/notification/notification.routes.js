const express = require('express');
const router = express.Router();
const ctrl = require('./notification.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.use(protect);
router.get('/', ctrl.getNotifications);
router.put('/read-all', ctrl.markAllRead);
router.delete('/clear-all', ctrl.clearAll);
router.put('/:id/read', ctrl.markOneRead);
router.delete('/:id', ctrl.deleteOne);
module.exports = router;