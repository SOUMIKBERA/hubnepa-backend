require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();

// ─── SECURITY (load with try/catch so missing package never crashes app) ──────
try {
  const helmet = require('helmet');
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
} catch (_) {}

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

try {
  const compression = require('compression');
  app.use(compression());
} catch (_) {}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

try {
  const mongoSanitize = require('express-mongo-sanitize');
  app.use(mongoSanitize({ replaceWith: '_' }));
} catch (_) {}

try {
  const hpp = require('hpp');
  app.use(hpp({ whitelist: ['sort','fields','page','limit','status','category'] }));
} catch (_) {}

// Manual XSS clean (no external package needed)
const xssClean = (req, res, next) => {
  const clean = (obj) => {
    if (typeof obj === 'string') return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,'').replace(/javascript:/gi,'');
    if (Array.isArray(obj)) return obj.map(clean);
    if (obj && typeof obj === 'object') { const r={}; for (const k in obj) r[k]=clean(obj[k]); return r; }
    return obj;
  };
  if (req.body) req.body = clean(req.body);
  if (req.query) req.query = clean(req.query);
  next();
};
app.use(xssClean);

// Rate limiter
try {
  const rateLimit = require('express-rate-limit');
  const apiLimiter = rateLimit({ windowMs: 15*60*1000, max: 200, standardHeaders: true, legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'development',
    message: { success: false, message: 'Too many requests. Try again in 15 minutes.' },
  });
  app.use(apiLimiter);
} catch (_) {}

if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// ─── HEALTH (put before auth routes so it always works) ───────────────────────
app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, message: 'HubNepa API is running ✅', version: 'v1',
    environment: process.env.NODE_ENV || 'development', timestamp: new Date().toISOString() });
});

// ─── ROUTES ───────────────────────────────────────────────────────────────────

// Core Auth & User
app.use('/api/v1/auth',             require('./modules/auth/auth.routes'));
app.use('/api/v1/users',            require('./modules/user/user.routes'));
app.use('/api/v1/referral',         require('./modules/user/referral.routes'));
app.use('/api/v1/notifications',    require('./modules/notification/notification.routes'));

// Customer Panel
app.use('/api/v1/restaurants',      require('./modules/restaurant/restaurant.routes'));
app.use('/api/v1/products',         require('./modules/product/product.routes'));
app.use('/api/v1/cart',             require('./modules/cart/cart.routes'));
app.use('/api/v1/orders',           require('./modules/order/order.routes'));
app.use('/api/v1/wallet',           require('./modules/wallet/wallet.routes'));
app.use('/api/v1/wishlist',         require('./modules/wishlist/wishlist.routes'));
app.use('/api/v1/reviews',          require('./modules/review/review.routes'));
app.use('/api/v1/support',          require('./modules/support/support.routes'));

// Partner Panels
app.use('/api/v1/restaurant-panel', require('./modules/restaurant-panel/restaurant-panel.routes'));
app.use('/api/v1/retailer',         require('./modules/retailer/retailer.routes'));
app.use('/api/v1/supplier',         require('./modules/supplier-panel/supplier-panel.routes'));
app.use('/api/v1/delivery',         require('./modules/delivery-panel/delivery-panel.routes'));
app.use('/api/v1/admin',            require('./modules/admin-panel/admin-panel.routes'));

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found.` });
});

// ─── GLOBAL ERROR HANDLER ────────────────────────────────────────────────────
app.use(require('./middlewares/error.middleware'));

module.exports = app;