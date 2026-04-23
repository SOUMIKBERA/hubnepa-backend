const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  retailer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  code: { type: String, required: true, uppercase: true, trim: true },
  discountType: { type: String, enum: ['Percentage Off', 'Fixed Amount', 'Free Shipping'], required: true },
  discountValue: { type: Number, required: true, min: 0 },
  minimumPurchase: { type: Number, default: 0 },
  validFrom: { type: Date, required: true },
  validUntil: { type: Date, required: true },
  usageLimit: { type: Number, default: null },
  usedCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

offerSchema.index({ retailer: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Offer', offerSchema);