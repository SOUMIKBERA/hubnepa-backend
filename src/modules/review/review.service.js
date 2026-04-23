const Review = require('./review.model');
const Order = require('../order/order.model');
const paginate = require('../../utils/paginate');

const createReview = async (userId, data) => {
  // Verify purchase before allowing review
  if (data.orderId) {
    const order = await Order.findOne({ _id: data.orderId, customer: userId, status: 'delivered' });
    if (!order) { const e = new Error('You can only review after a delivered order.'); e.statusCode = 400; throw e; }
    data.isVerifiedPurchase = true;
    data.order = data.orderId;
  }
  // Check duplicate review
  const existing = await Review.findOne({ user: userId, targetType: data.targetType, ...(data.targetType === 'restaurant' ? { restaurant: data.targetId } : { product: data.targetId }) });
  if (existing) { const e = new Error('You have already reviewed this item.'); e.statusCode = 409; throw e; }
  const reviewData = { user: userId, targetType: data.targetType, rating: data.rating, comment: data.comment, images: data.images || [], isVerifiedPurchase: data.isVerifiedPurchase || false, order: data.order || null };
  if (data.targetType === 'restaurant') reviewData.restaurant = data.targetId;
  if (data.targetType === 'product') reviewData.product = data.targetId;
  if (data.targetType === 'delivery') reviewData.deliveryPartner = data.targetId;
  const review = await Review.create(reviewData);
  return review.populate('user', 'firstName lastName avatar');
};

const getRestaurantReviews = async (restaurantId, query) => {
  return paginate(Review, { targetType: 'restaurant', restaurant: restaurantId, isApproved: true }, { page: query.page, limit: query.limit, sort: { createdAt: -1 }, populate: { path: 'user', select: 'firstName lastName avatar' } });
};

const getProductReviews = async (productId, query) => {
  return paginate(Review, { targetType: 'product', product: productId, isApproved: true }, { page: query.page, limit: query.limit, sort: { createdAt: -1 }, populate: { path: 'user', select: 'firstName lastName avatar' } });
};

const replyToReview = async (reviewId, ownerId, message) => {
  const review = await Review.findOneAndUpdate(
    { _id: reviewId, $or: [{ 'restaurant': { $exists: true } }, { 'product': { $exists: true } }] },
    { retailerReply: { message, repliedAt: new Date(), repliedBy: ownerId } },
    { new: true }
  );
  if (!review) { const e = new Error('Review not found.'); e.statusCode = 404; throw e; }
  return review;
};

const markHelpful = async (reviewId, userId) => {
  const review = await Review.findById(reviewId);
  if (!review) { const e = new Error('Review not found.'); e.statusCode = 404; throw e; }
  const alreadyVoted = review.helpfulVoters.includes(userId);
  if (alreadyVoted) {
    review.helpfulVoters.pull(userId);
    review.helpfulCount = Math.max(0, review.helpfulCount - 1);
  } else {
    review.helpfulVoters.push(userId);
    review.helpfulCount += 1;
  }
  await review.save();
  return review;
};

const deleteReview = async (reviewId, userId, isAdmin = false) => {
  const query = isAdmin ? { _id: reviewId } : { _id: reviewId, user: userId };
  await Review.findOneAndDelete(query);
};

module.exports = { createReview, getRestaurantReviews, getProductReviews, replyToReview, markHelpful, deleteReview };