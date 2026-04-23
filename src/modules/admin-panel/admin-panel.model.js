const mongoose = require('mongoose');

// ─── Admin Role ──────
const permissionsSchema = new mongoose.Schema({
  view: { type: Boolean, default: false },
  create: { type: Boolean, default: false },
  edit: { type: Boolean, default: false },
  delete: { type: Boolean, default: false },
}, { _id: false });

const adminRoleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, trim: true },
  permissions: {
    dashboard: { ...permissionsSchema.obj, export: { type: Boolean, default: false } },
    userManagement: { ...permissionsSchema.obj, block: { type: Boolean, default: false } },
    partnerManagement: { ...permissionsSchema.obj, approve: { type: Boolean, default: false }, verifyDocuments: { type: Boolean, default: false }, manageCommissions: { type: Boolean, default: false } },
    restaurantPanel: permissionsSchema.obj,
    retailerPanel: permissionsSchema.obj,
    supplierPanel: { view: Boolean, create: Boolean, cancel: Boolean },
    productFood: permissionsSchema.obj,
    orderManagement: permissionsSchema.obj,
    feedbackComplaints: { view: Boolean, edit: Boolean },
    financeSettlements: permissionsSchema.obj,
    salesAnalytics: permissionsSchema.obj,
    marketingContent: permissionsSchema.obj,
    accessControl: permissionsSchema.obj,
    systemSettings: { view: Boolean, edit: Boolean },
  },
  isDefault: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// ─── Admin User ───────
const adminUserSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminRole', required: true },
  status: { type: String, enum: ['Active', 'Inactive', 'Suspended'], default: 'Active' },
  lastLogin: { type: Date },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// ─── Audit Log ───────
const auditLogSchema = new mongoose.Schema({
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  action: { type: String, required: true, index: true },
  targetResource: { type: String },
  targetId: { type: mongoose.Schema.Types.ObjectId },
  details: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
  success: { type: Boolean, default: true },
}, { timestamps: true });

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ performedBy: 1, createdAt: -1 });

// ─── Complaint ──────
const complaintSchema = new mongoose.Schema({
  complaintId: { type: String, unique: true, sparse: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  vendorName: { type: String },
  type: { type: String, enum: ['Complaint', 'Feedback'], default: 'Complaint' },
  category: { type: String, enum: ['Late Delivery', 'Wrong Item', 'Excellent Service', 'Food Quality', 'Damaged Product', 'Payment Issue', 'Driver Issue', 'Other'], required: true },
  description: { type: String, required: true, maxlength: 2000 },
  status: { type: String, enum: ['Open', 'In Review', 'Investigation', 'Resolved', 'Rejected'], default: 'Open', index: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  resolutionNote: { type: String },
  resolvedAt: { type: Date },
}, { timestamps: true });

complaintSchema.pre('save', function(next) {
  if (!this.complaintId) this.complaintId = 'COMP-' + Date.now().toString(36).toUpperCase().slice(-6) + Math.floor(100 + Math.random() * 900);
  if (this.status === 'Resolved' && !this.resolvedAt) this.resolvedAt = new Date();
  next();
});

// ─── Campaign ──────
const campaignSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['Banner', 'Coupon', 'Push Notification', 'Email', 'SMS'], required: true },
  status: { type: String, enum: ['Active', 'Inactive', 'Draft', 'Ended', 'Scheduled'], default: 'Draft', index: true },
  targetAudience: { type: String, enum: ['All Users', 'New Users', 'Inactive Users', 'Premium Users', 'Restaurants', 'Retailers'], default: 'All Users' },
  startDate: { type: Date },
  endDate: { type: Date },
  reach: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  description: { type: String },
  imageUrl: { type: String },
  couponCode: { type: String },
  message: { type: String },
  triggers: { type: String, enum: ['Manual', 'Automated', 'Daily', 'Weekly'] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// ─── Platform Setting ────
const platformSettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true },
  value: { type: mongoose.Schema.Types.Mixed },
  category: { type: String, enum: ['general', 'legal', 'notifications', 'payments', 'localization', 'system', 'seo'], index: true },
  description: { type: String },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = {
  AdminRole: mongoose.models.AdminRole || mongoose.model('AdminRole', adminRoleSchema),
  AdminUser: mongoose.models.AdminUser || mongoose.model('AdminUser', adminUserSchema),
  AuditLog: mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema),
  Complaint: mongoose.models.Complaint || mongoose.model('Complaint', complaintSchema),
  Campaign: mongoose.models.Campaign || mongoose.model('Campaign', campaignSchema),
  PlatformSetting: mongoose.models.PlatformSetting || mongoose.model('PlatformSetting', platformSettingSchema),
};