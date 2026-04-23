const express = require('express');
const router = express.Router();
const ctrl = require('./wallet.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

router.use(protect, authorize('customer'));
router.get('/', ctrl.getWallet);
router.post('/top-up', ctrl.topUp);
router.post('/withdraw', ctrl.withdraw);
router.get('/transactions', ctrl.getHistory);
router.post('/apply-voucher', ctrl.applyVoucher);

module.exports = router;