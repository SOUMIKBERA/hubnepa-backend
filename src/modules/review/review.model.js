const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetType: { type: String, enum: ['restaurant', 'product', 'delivery'], required: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', default: null },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, trim: true },
  images: [{ type: String }],
  helpfulCount: { type: Number, default: 0 },
  retailerReply: { type: String, default: null },
  retailerRepliedAt: { type: Date, default: null },
  isVerifiedPurchase: { type: Boolean, default: true },
}, { timestamps: true });

reviewSchema.index({ restaurant: 1, targetType: 1 });
reviewSchema.index({ product: 1, targetType: 1 });
reviewSchema.index({ reviewer: 1, order: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);