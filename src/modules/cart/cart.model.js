const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  itemType: { type: String, enum: ['product', 'menuItem'], required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', default: null },
  menuItemId: { type: mongoose.Schema.Types.ObjectId, default: null },
  name: { type: String, required: true },
  image: { type: String, default: null },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  subtotal: { type: Number, required: true },
}, { _id: true });

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [cartItemSchema],
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', default: null },
  itemCount: { type: Number, default: 0 },
  subtotal: { type: Number, default: 0 },
}, { timestamps: true });

// Recalculate totals before save
cartSchema.pre('save', function (next) {
  this.subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);
  this.itemCount = this.items.reduce((sum, item) => sum + item.quantity, 0);
  next();
});

module.exports = mongoose.model('Cart', cartSchema);