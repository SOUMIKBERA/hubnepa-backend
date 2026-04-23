const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const helmet = require('helmet');

// ─── RATE LIMITERS ────

/** Strict limiter for auth endpoints */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: 'Too many requests. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

/** Limiter for password reset */
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { success: false, message: 'Too many reset requests. Try again in 1 hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/** General API limiter */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Rate limit exceeded. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development',
});

/** Strict limiter for OTP send */
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3,
  message: { success: false, message: 'Too many OTP requests. Wait 10 minutes.' },
});

// ─── MONGO SANITIZE ─────
const sanitizeMongo = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`⚠️  Sanitized field "${key}" from ${req.ip}`);
  },
});

// ─── HPP ──────
const preventHpp = hpp({
  whitelist: ['sort', 'fields', 'page', 'limit', 'status', 'category', 'role'],
});

// ─── HELMET ──────
const secureHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

// ─── XSS CLEAN (manual) ──────
const xssClean = (req, res, next) => {
  const clean = (obj) => {
    if (typeof obj === 'string') return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').replace(/javascript:/gi, '').replace(/on\w+\s*=/gi, '');
    if (Array.isArray(obj)) return obj.map(clean);
    if (obj && typeof obj === 'object') { const cleaned = {}; for (const key in obj) { cleaned[key] = clean(obj[key]); } return cleaned; }
    return obj;
  };
  if (req.body) req.body = clean(req.body);
  if (req.query) req.query = clean(req.query);
  if (req.params) req.params = clean(req.params);
  next();
};

module.exports = { authLimiter, forgotPasswordLimiter, apiLimiter, otpLimiter, sanitizeMongo, preventHpp, secureHeaders, xssClean };