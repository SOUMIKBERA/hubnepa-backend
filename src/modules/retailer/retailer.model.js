const mongoose = require('mongoose');

// ─── Retailer Profile / KYC ────────────
const retailerProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  storeName: { type: String, required: true, trim: true },
  storeLogo: { type: String, default: null },
  storeBanner: { type: String, default: null },
  storeDescription: { type: String },
  businessAddress: { type: String },
  contactPerson: { type: String },
  email: { type: String },
  phone: { type: String },
  // KYC Documents
  kyc: {
    businessLicense: { url: String, status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }, uploadedAt: Date },
    taxId: { url: String, status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }, uploadedAt: Date },
    additionalDocs: [{ url: String, name: String, uploadedAt: Date }],
    isVerified: { type: Boolean, default: false },
  },
  // Notification preferences
  notificationPrefs: {
    newOrder: { email: { type: Boolean, default: true }, sms: { type: Boolean, default: false } },
    orderCancelled: { email: { type: Boolean, default: true }, sms: { type: Boolean, default: false } },
    payoutProcessed: { email: { type: Boolean, default: true }, sms: { type: Boolean, default: true } },
  },
  // Security
  twoFactorEnabled: { type: Boolean, default: false },
  bankDetails: { accountName: String, accountNumber: String, routingNumber: String, bankName: String },
  commissionRate: { type: Number, default: 10 },
  totalRevenue: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  rating: { average: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
  isActive: { type: Boolean, default: true },
  status: { type: String, enum: ['pending', 'active', 'suspended'], default: 'pending' },
}, { timestamps: true });

module.exports = {
  RetailerProfile: mongoose.models.RetailerProfile || mongoose.model('RetailerProfile', retailerProfileSchema),
};