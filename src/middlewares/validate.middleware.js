const Joi = require('joi');

/**
 * Validation middleware factory
 * @param {Joi.Schema} schema - Joi schema to validate against
 * @param {string} source - 'body' | 'query' | 'params'
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    });
    if (error) {
      const details = error.details.map((d) => d.message.replace(/['"]/g, ''));
      return res.status(422).json({ success: false, message: 'Validation failed.', errors: details });
    }
    req[source] = value;
    next();
  };
};

// ─── COMMON SCHEMAS ───────────────────────────────────────────────────────────
const schemas = {
  // Auth
  register: Joi.object({
    firstName: Joi.string().min(2).max(50).trim().required(),
    lastName: Joi.string().min(2).max(50).trim().required(),
    email: Joi.string().email().lowercase().trim().required(),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required().messages({
      'string.pattern.base': 'Password must have uppercase, lowercase, and number',
    }),
    phone: Joi.string().pattern(/^\+?[\d\s\-]{7,15}$/).optional(),
    role: Joi.string().valid('customer', 'restaurant', 'retailer', 'supplier', 'delivery').default('customer'),
    referralCode: Joi.string().optional(),
  }),
  login: Joi.object({
    email: Joi.string().email().lowercase().trim().required(),
    password: Joi.string().required(),
  }),
  forgotPassword: Joi.object({ email: Joi.string().email().lowercase().trim().required() }),
  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required(),
  }),
  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required(),
  }),
  // Address
  address: Joi.object({
    label: Joi.string().valid('Home', 'Office', 'Other').default('Home'),
    fullName: Joi.string().min(2).max(100).required(),
    phone: Joi.string().pattern(/^\+?[\d\s\-]{7,15}$/).required(),
    street: Joi.string().min(5).max(200).required(),
    city: Joi.string().min(2).max(100).required(),
    state: Joi.string().min(2).max(100).required(),
    zipCode: Joi.string().min(4).max(10).required(),
    country: Joi.string().default('US'),
    isDefault: Joi.boolean().default(false),
  }),
  // Review
  review: Joi.object({
    targetType: Joi.string().valid('restaurant', 'product', 'delivery').required(),
    targetId: Joi.string().length(24).hex().required(),
    orderId: Joi.string().length(24).hex().optional(),
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().min(5).max(1000).required(),
    images: Joi.array().items(Joi.string().uri()).max(5).optional(),
  }),
  // Order
  placeOrder: Joi.object({
    orderType: Joi.string().valid('food', 'retail').required(),
    deliveryAddressId: Joi.string().length(24).hex().when('orderType', { is: 'food', then: Joi.required() }),
    paymentMethod: Joi.string().valid('wallet', 'card', 'cash_on_delivery').required(),
    savedCardId: Joi.string().optional(),
    voucherCode: Joi.string().optional(),
    scheduledAt: Joi.date().min('now').optional(),
    instructions: Joi.string().max(500).optional(),
    tip: Joi.number().min(0).max(50).default(0),
  }),
  // Support ticket
  ticket: Joi.object({
    subject: Joi.string().min(5).max(200).required(),
    category: Joi.string().valid('Order Issues', 'Payment & Refunds', 'Account & Settings', 'Other').required(),
    priority: Joi.string().valid('Low', 'Medium', 'High').default('Medium'),
    message: Joi.string().min(10).max(2000).required(),
    orderId: Joi.string().length(24).hex().optional(),
  }),
};

module.exports = { validate, schemas };