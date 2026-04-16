const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  itemType: { type: String, enum: ['product', 'menuItem'] },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  menuItemId: { type: mongoose.Schema.Types.ObjectId, default: null },
  name: { type: String, required: true },
  image: { type: String, default: null },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  subtotal: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', default: null },
  retailer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  deliveryPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  orderType: { type: String, enum: ['food', 'grocery'], required: true },
  items: [orderItemSchema],
  deliveryAddress: {
    fullName: String, phone: String, street: String,
    city: String, state: String, zipCode: String,
  },
  scheduledDelivery: { type: Date, default: null },
  paymentMethod: { type: String, enum: ['card', 'wallet', 'cash'], required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  paymentDetails: { cardLast4: String, cardBrand: String, transactionId: String },
  subtotal: { type: Number, required: true },
  deliveryFee: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'in_transit', 'delivered', 'cancelled'],
    default: 'pending',
    index: true,
  },
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String,
  }],
  estimatedDelivery: { type: Date },
  deliveredAt: { type: Date },
  cancelledAt: { type: Date },
  cancelReason: { type: String },
  isContactless: { type: Boolean, default: true },
  refundStatus: { type: String, enum: ['none', 'requested', 'approved', 'rejected', 'processed'], default: 'none' },
  refundAmount: { type: Number, default: 0 },
  notes: { type: String },
}, { timestamps: true });

// Auto-generate orderId
orderSchema.pre('save', function (next) {
  if (!this.orderId) {
    this.orderId = 'ORD-' + Math.random().toString(36).substr(2, 6).toUpperCase() + Date.now().toString().slice(-4);
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);