const express = require('express');
const router = express.Router();
const ctrl = require('./wishlist.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.use(protect);
router.get('/', ctrl.getWishlist);
router.post('/add', ctrl.addItem);
router.delete('/clear', ctrl.clearWishlist);
router.delete('/:itemId', ctrl.removeItem);
module.exports = router;