const mongoose = require('mongoose');

// ─── Delivery Profile ────
const deliveryProfileSchema = new mongoose.Schema({
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  vehicleType: { type: String, enum: ['bike', 'car', 'scooter', 'van', 'truck'], default: 'bike' },
  vehicleNumber: { type: String, trim: true },
  vehicleModel: { type: String, trim: true },
  isOnline: { type: Boolean, default: false },
  currentLocation: {
    lat: { type: Number },
    lng: { type: Number },
    address: { type: String },
    updatedAt: { type: Date, default: Date.now },
  },
  totalDeliveries: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  todayEarnings: { type: Number, default: 0 },
  weekEarnings: { type: Number, default: 0 },
  monthEarnings: { type: Number, default: 0 },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
  },
  bankDetails: {
    accountName: { type: String },
    accountNumber: { type: String },
    routingNumber: { type: String },
    bankName: { type: String },
  },
  documents: {
    drivingLicense: { url: String, verified: { type: Boolean, default: false } },
    vehicleInsurance: { url: String, verified: { type: Boolean, default: false } },
    idProof: { url: String, verified: { type: Boolean, default: false } },
  },
  isVerified: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  lastActiveAt: { type: Date, default: Date.now },
  preferredZones: [String],
  twoFactorEnabled: { type: Boolean, default: false },
}, { timestamps: true });

deliveryProfileSchema.index({ driver: 1 });
deliveryProfileSchema.index({ isOnline: 1, status: 1 });

// ─── Earnings Log ─────────────────────────────────────────────────────────────
const earningsLogSchema = new mongoose.Schema({
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  amount: { type: Number, required: true, min: 0 },
  type: { type: String, enum: ['delivery_fee', 'tip', 'bonus', 'adjustment', 'payout'], default: 'delivery_fee' },
  description: { type: String },
  status: { type: String, enum: ['pending', 'paid', 'held', 'reversed'], default: 'paid' },
  date: { type: Date, default: Date.now },
}, { timestamps: true });

earningsLogSchema.index({ driver: 1, date: -1 });
earningsLogSchema.index({ driver: 1, status: 1 });

module.exports = {
  DeliveryProfile: mongoose.models.DeliveryProfile || mongoose.model('DeliveryProfile', deliveryProfileSchema),
  EarningsLog: mongoose.models.EarningsLog || mongoose.model('EarningsLog', earningsLogSchema),
};