const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  discountType: { type: String, enum: ['percentage', 'fixed', 'free_shipping'], required: true },
  discountValue: { type: Number, required: true, min: 0 },
  minimumPurchase: { type: Number, default: 0 },
  maximumDiscount: { type: Number, default: null },
  usageLimit: { type: Number, default: null },
  usedCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date, required: true },
  applicableTo: { type: String, enum: ['all', 'food', 'grocery'], default: 'all' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Voucher', voucherSchema);