const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  price: { type: Number, required: true, min: 0 },
  discountPrice: { type: Number, default: null },
  category: { type: String, enum: ['Appetizers', 'Main Course', 'Desserts', 'Drinks', 'Specials'], required: true },
  image: { type: String, default: null },
  isAvailable: { type: Boolean, default: true },
  isVeg: { type: Boolean, default: false },
  tags: [String],
  preparationTime: { type: Number, default: 15 }, // minutes
}, { timestamps: true });

const restaurantSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, lowercase: true },
  description: { type: String },
  logo: { type: String, default: null },
  banner: { type: String, default: null },
  cuisine: [{ type: String }],
  tags: [{ type: String }], // e.g. Premium, Luxury, Affordable
  address: {
    street: String, city: String, state: String,
    zipCode: String, country: { type: String, default: 'US' },
    coordinates: { lat: Number, lng: Number },
  },
  phone: { type: String },
  email: { type: String },
  openingHours: {
    mon: { open: String, close: String, isClosed: Boolean },
    tue: { open: String, close: String, isClosed: Boolean },
    wed: { open: String, close: String, isClosed: Boolean },
    thu: { open: String, close: String, isClosed: Boolean },
    fri: { open: String, close: String, isClosed: Boolean },
    sat: { open: String, close: String, isClosed: Boolean },
    sun: { open: String, close: String, isClosed: Boolean },
  },
  deliveryTime: { min: { type: Number, default: 25 }, max: { type: Number, default: 45 } },
  deliveryFee: { type: Number, default: 2.99 },
  minimumOrder: { type: Number, default: 10 },
  freeDeliveryAbove: { type: Number, default: 50 },
  menu: [menuItemSchema],
  rating: { average: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
  totalOrders: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  isOpen: { type: Boolean, default: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'suspended'], default: 'pending' },
  isExclusivePartner: { type: Boolean, default: false },
  distanceInMiles: { type: Number, default: null },
}, { timestamps: true });

restaurantSchema.index({ 'address.coordinates': '2dsphere' });
restaurantSchema.index({ name: 'text', cuisine: 'text', tags: 'text' });

module.exports = mongoose.model('Restaurant', restaurantSchema);