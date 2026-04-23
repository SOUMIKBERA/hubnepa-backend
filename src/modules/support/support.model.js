const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole: { type: String, enum: ['user', 'admin', 'support'], default: 'user' },
  message: { type: String, required: true, maxlength: 2000 },
  attachments: [{ url: String, type: String }],
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

const ticketSchema = new mongoose.Schema({
  ticketId: { type: String, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  subject: { type: String, required: true, trim: true, maxlength: 200 },
  category: { type: String, enum: ['Order Issues', 'Payment & Refunds', 'Account & Settings', 'Product Issue', 'Delivery Issue', 'Technical', 'Other'], required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  status: { type: String, enum: ['Open', 'In Progress', 'Resolved', 'Closed', 'Reopened'], default: 'Open' },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  messages: [messageSchema],
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  resolvedAt: { type: Date, default: null },
  rating: { value: { type: Number, min: 1, max: 5 }, comment: String },
  lastReplyAt: { type: Date, default: Date.now },
  tags: [String],
}, { timestamps: true });

ticketSchema.pre('save', function(next) {
  if (!this.ticketId) {
    this.ticketId = 'TCK-' + Math.floor(1000 + Math.random() * 9000) + Date.now().toString().slice(-4);
  }
  next();
});

ticketSchema.index({ user: 1, status: 1 });
ticketSchema.index({ status: 1, priority: -1 });
ticketSchema.index({ ticketId: 1 });

module.exports = mongoose.models.Ticket || mongoose.model('Ticket', ticketSchema);