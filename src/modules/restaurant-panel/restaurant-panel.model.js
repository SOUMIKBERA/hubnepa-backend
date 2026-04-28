const mongoose = require('mongoose');

// ─── Staff Schema ─────────────────────────────────────────────────────────────
const staffSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String },
  role: { type: String, enum: ['Manager', 'Head Chef', 'Chef', 'Front Staff', 'Waitstaff', 'Delivery', 'Support Agent'], required: true },
  employmentType: { type: String, enum: ['Full-time', 'Part-time'], default: 'Full-time' },
  shiftType: { type: String, enum: ['Morning', 'Afternoon', 'Evening', 'Night', 'Split'], default: 'Morning' },
  branch: { type: String, default: 'Downtown HQ' },
  loginCode: { type: String, length: 4 },
  status: { type: String, enum: ['Active', 'Training', 'Inactive', 'Terminated'], default: 'Active' },
  startDate: { type: Date },
  salary: { type: Number, default: 0 },
  hourlyRate: { type: Number, default: 0 },
  accessRoles: {
    orders: { view: Boolean, create: Boolean, edit: Boolean, delete: Boolean },
    menuManagement: { view: Boolean, create: Boolean, edit: Boolean, delete: Boolean },
    inventory: { view: Boolean, create: Boolean, edit: Boolean, delete: Boolean },
    expenses: { view: Boolean, create: Boolean, edit: Boolean, delete: Boolean },
    reports: { view: Boolean, create: Boolean, edit: Boolean, delete: Boolean },
    teamManagement: { view: Boolean, create: Boolean, edit: Boolean, delete: Boolean },
    finance: { view: Boolean, create: Boolean, edit: Boolean, delete: Boolean },
  },
  avatar: { type: String, default: null },
  terminationReason: { type: String, default: null },
}, { timestamps: true });

// ─── Shift Schema ────────────────────────────────────────────────────────────
const shiftSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  staff: { type: mongoose.Schema.Types.ObjectId, ref: 'RestaurantStaff', required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  branch: { type: String },
  status: { type: String, enum: ['Scheduled', 'Completed', 'Absent', 'Swap Requested', 'Approved'], default: 'Scheduled' },
  swapWith: { type: mongoose.Schema.Types.ObjectId, ref: 'RestaurantStaff', default: null },
  notes: { type: String },
}, { timestamps: true });

// ─── Staff Request Schema ─────────────────────────────────────────────────────
const staffRequestSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  staff: { type: mongoose.Schema.Types.ObjectId, ref: 'RestaurantStaff', required: true },
  type: { type: String, enum: ['Time Off', 'Shift Swap'], required: true },
  startDate: { type: Date },
  endDate: { type: Date },
  reason: { type: String },
  swapWith: { type: mongoose.Schema.Types.ObjectId, ref: 'RestaurantStaff', default: null },
  swapDate: { type: Date },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
}, { timestamps: true });

// ─── Payroll Schema ───────────────────────────────────────────────────────────
const payrollSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  staff: { type: mongoose.Schema.Types.ObjectId, ref: 'RestaurantStaff', required: true },
  month: { type: String, required: true }, // e.g. "January 2026"
  periodStart: { type: Date },
  periodEnd: { type: Date },
  hoursWorked: { type: Number, default: 80 },
  hourlyRate: { type: Number, default: 0 },
  baseSalary: { type: Number, default: 0 },
  totalPay: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Paid', 'Processing'], default: 'Pending' },
  paymentDate: { type: Date },
}, { timestamps: true });

// ─── Expense Schema ───────────────────────────────────────────────────────────
const expenseSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
  title: { type: String, trim: true },
  description: { type: String, trim: true },
  category: {
    type: String,
    enum: ['Food Supplies', 'Staff Salary', 'Kitchen Supplies', 'Cleaning Supplies', 'Maintenance', 'Utilities', 'Office Supplies', 'Catering Supplies', 'Beverage', 'Other', 'Rent', 'Laundry Supplies'],
    required: true,
  },
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, required: true },
  type: { type: String, enum: ['Fixed Cost', 'Variable', 'Inventory', 'Pending'], default: 'Variable' },
  status: { type: String, enum: ['Paid', 'Pending', 'Due Soon', 'Overdue', 'Approved', 'Rejected'], default: 'Pending' },
  notes: { type: String },
  vendor: { type: String },
  receiptUrl: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// ─── Maintenance Issue Schema ──────────────────────────────────────────────────
const maintenanceSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  itemName: { type: String, trim: true },
  priority: { type: String, enum: ['High Priority', 'Medium Priority', 'Low Priority'], default: 'Medium Priority' },
  issue: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'In Progress', 'Resolved', 'Scheduled'], default: 'Pending' },
  vendor: { type: String },
  cost: { type: Number, default: 0 },
  dateReported: { type: Date, default: Date.now },
  resolvedDate: { type: Date },
}, { timestamps: true });

// ─── Sales Closing Schema ─────────────────────────────────────────────────────
const salesClosingSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
  date: { type: Date, required: true },
  inHouseSales: { type: Number, default: 0 },
  uberEatsSales: { type: Number, default: 0 },
  deliverooSales: { type: Number, default: 0 },
  grubHubSales: { type: Number, default: 0 },
  justEatSales: { type: Number, default: 0 },
  instaCartSales: { type: Number, default: 0 },
  doordashSales: { type: Number, default: 0 },
  ezeCaterSales: { type: Number, default: 0 },
  cateringSales: { type: Number, default: 0 },
  otherSales: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  status: { type: String, enum: ['Draft', 'Verified', 'Missing'], default: 'Draft' },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Auto-calc total
salesClosingSchema.pre('save', function(next) {
  this.totalRevenue = (this.inHouseSales || 0) + (this.uberEatsSales || 0) + (this.deliverooSales || 0) +
    (this.grubHubSales || 0) + (this.justEatSales || 0) + (this.instaCartSales || 0) +
    (this.doordashSales || 0) + (this.ezeCaterSales || 0) + (this.cateringSales || 0) + (this.otherSales || 0);
  next();
});

// ─── Inventory Item Schema ────────────────────────────────────────────────────
const inventoryItemSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
  itemName: { type: String, required: true, trim: true },
  category: { type: String, enum: ['Produce', 'Bakery', 'Pantry', 'Dairy', 'Beverage', 'Meat', 'Seafood', 'Other'], required: true },
  itemType: { type: String, enum: ['Raw', 'Cooked', 'Solid', 'Beverage'], required: true },
  unitOfMeasure: { type: String, default: 'kg' },
  currentStock: { type: Number, default: 0, min: 0 },
  minThreshold: { type: Number, default: 5 },
  costPerUnit: { type: Number, default: 0 },
  supplier: { type: String },
  status: { type: String, enum: ['Good', 'Low', 'Critical', 'Out of Stock', 'In Stock'], default: 'In Stock' },
  expiryDate: { type: Date, default: null },
  preparedBy: { type: String },
  preparedAt: { type: Date },
  notes: { type: String },
}, { timestamps: true });

inventoryItemSchema.pre('save', function(next) {
  if (this.currentStock === 0) this.status = 'Out of Stock';
  else if (this.currentStock <= this.minThreshold * 0.5) this.status = 'Critical';
  else if (this.currentStock <= this.minThreshold) this.status = 'Low';
  else this.status = 'In Stock';
  next();
});

// ─── Beverage Inventory Schema ────────────────────────────────────────────────
const beverageSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  name: { type: String, required: true },
  category: { type: String, enum: ['Soft Drink', 'Juice', 'Water', 'Tea', 'Coffee', 'Alcohol', 'Other'], required: true },
  currentStock: { type: Number, default: 0 },
  minThreshold: { type: Number, default: 20 },
  unitType: { type: String, default: 'Bottles' },
  supplier: { type: String },
  costPerUnit: { type: Number, default: 0 },
  status: { type: String, enum: ['In Stock', 'Low', 'Out of Stock'], default: 'In Stock' },
}, { timestamps: true });

// ─── Recipe Schema ────────────────────────────────────────────────────────────
const recipeSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  menuItem: { type: mongoose.Schema.Types.ObjectId },
  recipeName: { type: String, required: true },
  category: { type: String },
  servingDate: { type: Date },
  portionSize: { type: String },
  laborCost: { type: Number, default: 0 },
  chefHourlyRate: { type: Number, default: 0 },
  prepTimeMinutes: { type: Number, default: 0 },
  ingredients: [{
    name: String,
    type: { type: String, enum: ['Solid', 'Liquid'] },
    bulkWeight: Number,
    quantityUsed: Number,
    unitPrice: Number,
    finalCost: Number,
  }],
  totalIngredientCost: { type: Number, default: 0 },
  totalLaborCost: { type: Number, default: 0 },
  totalCost: { type: Number, default: 0 },
  sellingPrice: { type: Number, default: 0 },
  profitMargin: { type: Number, default: 0 },
  suggestedPrice: { type: Number, default: 0 },
}, { timestamps: true });

// ─── Restaurant Location Schema ───────────────────────────────────────────────
const restaurantLocationSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  name: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String },
  isActive: { type: Boolean, default: true },
  openingHours: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

module.exports = {
  RestaurantStaff: mongoose.models.RestaurantStaff || mongoose.model('RestaurantStaff', staffSchema),
  RestaurantShift: mongoose.models.RestaurantShift || mongoose.model('RestaurantShift', shiftSchema),
  StaffRequest: mongoose.models.StaffRequest || mongoose.model('StaffRequest', staffRequestSchema),
  Payroll: mongoose.models.Payroll || mongoose.model('Payroll', payrollSchema),
  RestaurantExpense: mongoose.models.RestaurantExpense || mongoose.model('RestaurantExpense', expenseSchema),
  MaintenanceIssue: mongoose.models.MaintenanceIssue || mongoose.model('MaintenanceIssue', maintenanceSchema),
  SalesClosing: mongoose.models.SalesClosing || mongoose.model('SalesClosing', salesClosingSchema),
  InventoryItem: mongoose.models.InventoryItem || mongoose.model('InventoryItem', inventoryItemSchema),
  BeverageInventory: mongoose.models.BeverageInventory || mongoose.model('BeverageInventory', beverageSchema),
  Recipe: mongoose.models.Recipe || mongoose.model('Recipe', recipeSchema),
  RestaurantLocation: mongoose.models.RestaurantLocation || mongoose.model('RestaurantLocation', restaurantLocationSchema),
};
