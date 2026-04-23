const mongoose = require('mongoose');

// ─── Supplier Product ─────
const bulkTierSchema = new mongoose.Schema({
  minQuantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
}, { _id: false });

const supplierProductSchema = new mongoose.Schema({
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  productName: { type: String, required: true, trim: true },
  sku: { type: String, trim: true, uppercase: true },
  category: { type: String, enum: ['Fresh Produce', 'Meat & Poultry', 'Seafood', 'Dairy', 'Grains', 'Oils', 'Packaging', 'Beverages', 'Other'], required: true },
  description: { type: String, trim: true },
  image: { type: String, default: null },
  unitType: { type: String, required: true },
  basePrice: { type: Number, required: true, min: 0 },
  bulkTiers: [bulkTierSchema],
  initialStock: { type: Number, default: 0 },
  currentStock: { type: Number, default: 0 },
  lowStockAlert: { type: Number, default: 10 },
  status: { type: String, enum: ['Active', 'Inactive', 'Low Stock', 'Out of Stock'], default: 'Active' },
  isFeatured: { type: Boolean, default: false },
  tags: [String],
  origin: { type: String },
}, { timestamps: true });

supplierProductSchema.index({ supplier: 1, status: 1 });
supplierProductSchema.index({ category: 1 });
supplierProductSchema.pre('save', function(next) {
  if (this.currentStock === 0) this.status = 'Out of Stock';
  else if (this.currentStock <= this.lowStockAlert) this.status = 'Low Stock';
  else if (this.isModified('currentStock') && this.status === 'Out of Stock') this.status = 'Active';
  next();
});

// ─── Wholesale Order ─────────
const wholesaleOrderSchema = new mongoose.Schema({
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clientName: { type: String, required: true },
  clientType: { type: String, enum: ['Restaurant', 'Retailer', 'Other'], default: 'Restaurant' },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'SupplierProduct' },
    productName: { type: String, required: true },
    sku: String,
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    subtotal: { type: Number, required: true },
  }],
  totalAmount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'], default: 'Pending', index: true },
  deliveryAddress: { street: String, city: String, state: String, zipCode: String, country: String },
  paymentStatus: { type: String, enum: ['Unpaid', 'Paid', 'Net 30', 'Overdue'], default: 'Unpaid' },
  notes: { type: String },
  orderId: { type: String, unique: true, sparse: true },
  estimatedDelivery: { type: Date },
  deliveredAt: { type: Date },
}, { timestamps: true });

wholesaleOrderSchema.pre('save', function(next) {
  if (!this.orderId) this.orderId = 'BO-' + Date.now().toString(36).toUpperCase() + Math.floor(100 + Math.random() * 900);
  next();
});

// ─── Supplier Client ───────
const supplierClientSchema = new mongoose.Schema({
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  clientName: { type: String, required: true, trim: true },
  clientType: { type: String, enum: ['Restaurant', 'Retailer', 'Other'], default: 'Restaurant' },
  email: { type: String, lowercase: true, trim: true },
  phone: { type: String },
  address: { type: String },
  city: { type: String },
  totalSpend: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  lastOrderAt: { type: Date },
  status: { type: String, enum: ['Active', 'At Risk', 'Inactive'], default: 'Active' },
  notes: { type: String },
}, { timestamps: true });

supplierClientSchema.index({ supplier: 1, status: 1 });

// ─── Warehouse Zone ───────
const warehouseZoneSchema = new mongoose.Schema({
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  zoneName: { type: String, required: true, trim: true },
  type: { type: String, enum: ['Cold Storage', 'Dry Goods', 'Fresh Produce', 'Packaging', 'Frozen'], required: true },
  temperature: { type: String },
  utilization: { type: Number, default: 0, min: 0, max: 100 },
  capacity: { type: Number, default: 100 },
  incomingToday: { type: Number, default: 0 },
  outgoingToday: { type: Number, default: 0 },
}, { timestamps: true });

// ─── Warehouse Item ───────────
const warehouseItemSchema = new mongoose.Schema({
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'SupplierProduct', required: true },
  zone: { type: mongoose.Schema.Types.ObjectId, ref: 'WarehouseZone', default: null },
  binLocation: { type: String, required: true, trim: true },
  onHand: { type: Number, default: 0, min: 0 },
  allocated: { type: Number, default: 0, min: 0 },
  available: { type: Number, default: 0 },
  unitType: { type: String },
  lastMoved: { type: Date, default: Date.now },
  status: { type: String, enum: ['In Stock', 'Low Stock', 'Out of Stock', 'Check'], default: 'In Stock' },
}, { timestamps: true });

warehouseItemSchema.pre('save', function(next) {
  this.available = Math.max(0, this.onHand - this.allocated);
  if (this.available === 0) this.status = 'Out of Stock';
  else if (this.available <= 5) this.status = 'Low Stock';
  else this.status = 'In Stock';
  next();
});

// ─── Shipment ───────────
const shipmentSchema = new mongoose.Schema({
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'WholesaleOrder', default: null },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  clientName: { type: String },
  shipmentId: { type: String, unique: true, sparse: true },
  carrier: { type: String },
  vehicleType: { type: String, enum: ['Van', 'Truck', 'Refrigerated', 'Local', 'Express'] },
  vehicle: { type: String },
  driver: { type: String },
  deliveryAddress: { type: String },
  pickupDate: { type: Date },
  estimatedDelivery: { type: Date },
  status: { type: String, enum: ['Pending', 'Loading', 'In Transit', 'Delivered', 'Cancelled', 'Failed'], default: 'Pending', index: true },
  items: [{ productName: String, quantity: Number, unit: String }],
  totalWeight: { type: Number },
  specialInstructions: { type: String },
  failureReason: { type: String },
  deliveredAt: { type: Date },
}, { timestamps: true });

shipmentSchema.pre('save', function(next) {
  if (!this.shipmentId) this.shipmentId = 'SHP-' + Date.now().toString(36).toUpperCase() + Math.floor(100 + Math.random() * 900);
  next();
});

// ─── Supplier Invoice ───────────────
const supplierInvoiceSchema = new mongoose.Schema({
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  clientName: { type: String, required: true },
  invoiceNumber: { type: String, unique: true },
  lineItems: [{
    description: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    total: { type: Number, required: true },
  }],
  subtotal: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  status: { type: String, enum: ['Draft', 'Sent', 'Paid', 'Overdue', 'Unpaid'], default: 'Draft', index: true },
  issuedDate: { type: Date, default: Date.now },
  dueDate: { type: Date },
  notes: { type: String },
}, { timestamps: true });

supplierInvoiceSchema.pre('save', function(next) {
  if (!this.invoiceNumber) this.invoiceNumber = 'INV-' + new Date().getFullYear() + '-' + Date.now().toString().slice(-6);
  this.subtotal = this.lineItems.reduce((s, i) => s + (i.total || 0), 0);
  this.tax = this.subtotal * (this.taxRate / 100);
  this.total = this.subtotal + this.tax;
  next();
});

module.exports = {
  SupplierProduct: mongoose.models.SupplierProduct || mongoose.model('SupplierProduct', supplierProductSchema),
  WholesaleOrder: mongoose.models.WholesaleOrder || mongoose.model('WholesaleOrder', wholesaleOrderSchema),
  SupplierClient: mongoose.models.SupplierClient || mongoose.model('SupplierClient', supplierClientSchema),
  WarehouseZone: mongoose.models.WarehouseZone || mongoose.model('WarehouseZone', warehouseZoneSchema),
  WarehouseItem: mongoose.models.WarehouseItem || mongoose.model('WarehouseItem', warehouseItemSchema),
  Shipment: mongoose.models.Shipment || mongoose.model('Shipment', shipmentSchema),
  SupplierInvoice: mongoose.models.SupplierInvoice || mongoose.model('SupplierInvoice', supplierInvoiceSchema),
};