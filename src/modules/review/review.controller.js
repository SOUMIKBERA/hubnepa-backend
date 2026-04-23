const reviewService = require('./review.service');
const { successResponse } = require('../../utils/apiResponse');

exports.createReview = async (req, res, next) => {
  try {
    const review = await reviewService.createReview(req.user._id, req.body);
    return successResponse(res, 201, 'Review submitted.', { review });
  } catch (e) { next(e); }
};

exports.getRestaurantReviews = async (req, res, next) => {
  try {
    const result = await reviewService.getRestaurantReviews(req.params.id, req.query);
    return successResponse(res, 200, 'Reviews fetched.', result);
  } catch (e) { next(e); }
};

exports.getProductReviews = async (req, res, next) => {
  try {
    const result = await reviewService.getProductReviews(req.params.id, req.query);
    return successResponse(res, 200, 'Reviews fetched.', result);
  } catch (e) { next(e); }
};

exports.replyToReview = async (req, res, next) => {
  try {
    const review = await reviewService.replyToReview(req.params.id, req.user._id, req.body.message);
    return successResponse(res, 200, 'Reply posted.', { review });
  } catch (e) { next(e); }
};

exports.markHelpful = async (req, res, next) => {
  try {
    const review = await reviewService.markHelpful(req.params.id, req.user._id);
    return successResponse(res, 200, 'Marked helpful.', { review });
  } catch (e) { next(e); }
};

exports.deleteReview = async (req, res, next) => {
  try {
    await reviewService.deleteReview(req.params.id, req.user._id, req.user.role === 'admin');
    return successResponse(res, 200, 'Review deleted.');
  } catch (e) { next(e); }
};