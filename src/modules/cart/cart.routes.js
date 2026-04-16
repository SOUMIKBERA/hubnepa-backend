const express = require('express');
const router = express.Router();
const ctrl = require('./cart.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

router.use(protect, authorize('customer'));
router.get('/', ctrl.getCart);
router.post('/add', ctrl.addToCart);
router.put('/items/:itemId', ctrl.updateCartItem);
router.delete('/items/:itemId', ctrl.removeFromCart);
router.delete('/clear', ctrl.clearCart);

module.exports = router;