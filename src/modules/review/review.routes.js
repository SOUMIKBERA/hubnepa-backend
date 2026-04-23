const express = require('express');
const router = express.Router();
const ctrl = require('./review.controller');
const { protect } = require('../../middlewares/auth.middleware');

// Public
router.get('/restaurant/:id', ctrl.getRestaurantReviews);
router.get('/product/:id', ctrl.getProductReviews);

// Protected
router.use(protect);
router.post('/', ctrl.createReview);
router.put('/:id/reply', ctrl.replyToReview);
router.put('/:id/helpful', ctrl.markHelpful);
router.delete('/:id', ctrl.deleteReview);

module.exports = router;