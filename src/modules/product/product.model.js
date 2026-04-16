const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  retailer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, lowercase: true },
  sku: { type: String, unique: true, sparse: true, trim: true },
  description: { type: String, trim: true },
  category: {
    type: String,
    enum: ['Organic Produce', 'Bakery', 'Dairy & Cheese', 'Gourmet Pantry', 'Beverages', 'Cooking Kits', 'Pro Tools', 'Other'],
    required: true,
  },
  images: [{ type: String }],
  basePrice: { type: Number, required: true, min: 0 },
  discountPrice: { type: Number, default: null },
  unit: { type: String, default: 'unit' }, // per pack, per loaf, 200g block, etc.
  weight: { type: Number, default: null },
  dimensions: { length: Number, width: Number, height: Number },
  shippingClass: {
    type: String,
    enum: ['Standard Shipping', 'Express Shipping', 'Heavy Item', 'Perishable Goods', 'Free Shipping'],
    default: 'Standard Shipping',
  },
  isFreeShipping: { type: Boolean, default: false },
  stockQuantity: { type: Number, default: 0, min: 0 },
  lowStockAlert: { type: Number, default: 5 },
  stockStatus: {
    type: String,
    enum: ['Active', 'Low Stock', 'Out of Stock', 'Inactive'],
    default: 'Active',
  },
  rating: { average: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
  totalSold: { type: Number, default: 0 },
  tags: [String],
  isNewArrival: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  adminApproved: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, { timestamps: true });

productSchema.index({ name: 'text', description: 'text', category: 'text', tags: 'text' });
productSchema.index({ retailer: 1, status: 1 });
productSchema.index({ category: 1, stockStatus: 1 });

// Auto update stockStatus
productSchema.pre('save', function (next) {
  if (this.stockQuantity === 0) this.stockStatus = 'Out of Stock';
  else if (this.stockQuantity <= this.lowStockAlert) this.stockStatus = 'Low Stock';
  else if (this.isActive === false) this.stockStatus = 'Inactive';
  else this.stockStatus = 'Active';
  next();
});

module.exports = mongoose.model('Product', productSchema);