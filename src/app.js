require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();

// ─── SECURITY ─────────────────────────────────────────────────────────────────
try {
  const helmet = require('helmet');
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
} catch (_) {}

// CORS — allow all origins (required for Postman + frontend integration)
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With'],
}));
app.options('*', cors()); // Handle preflight for all routes

try { app.use(require('compression')()); } catch (_) {}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

try { app.use(require('express-mongo-sanitize')({ replaceWith: '_' })); } catch (_) {}
try { app.use(require('hpp')({ whitelist: ['sort','fields','page','limit','status','category'] })); } catch (_) {}

// XSS clean (manual, no external package)
app.use((req, res, next) => {
  const clean = (obj) => {
    if (typeof obj === 'string') return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,'').replace(/javascript:/gi,'');
    if (Array.isArray(obj)) return obj.map(clean);
    if (obj && typeof obj === 'object') { const r={}; for (const k in obj) r[k]=clean(obj[k]); return r; }
    return obj;
  };
  if (req.body) req.body = clean(req.body);
  if (req.query) req.query = clean(req.query);
  next();
});

// Rate limiter — disabled in dev, lenient in prod
try {
  const rateLimit = require('express-rate-limit');
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 300 : 0,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV !== 'production',
    message: { success: false, message: 'Too many requests. Try again in 15 minutes.' },
  }));
} catch (_) {}

if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// ─── HEALTH (always first, no auth needed) ────────────────────────────────────
app.get('/', (req, res) => res.json({ success: true, message: 'HubNepa API ✅', docs: '/api/v1/health' }));
app.get('/api/v1/health', (req, res) => res.json({
  success: true,
  message: 'HubNepa API is running ✅',
  version: 'v1',
  environment: process.env.NODE_ENV || 'development',
  timestamp: new Date().toISOString(),
  endpoints: {
    auth: '/api/v1/auth',
    users: '/api/v1/users',
    restaurants: '/api/v1/restaurants',
    products: '/api/v1/products',
    orders: '/api/v1/orders',
    restaurantPanel: '/api/v1/restaurant-panel',
    retailerPanel: '/api/v1/retailer',
    supplierPanel: '/api/v1/supplier',
    deliveryPanel: '/api/v1/delivery',
    adminPanel: '/api/v1/admin',
  }
}));

// ─── ALL ROUTES ───────────────────────────────────────────────────────────────
app.use('/api/v1/auth',             require('./modules/auth/auth.routes'));
app.use('/api/v1/users',            require('./modules/user/user.routes'));
app.use('/api/v1/referral',         require('./modules/user/referral.routes'));
app.use('/api/v1/notifications',    require('./modules/notification/notification.routes'));
app.use('/api/v1/restaurants',      require('./modules/restaurant/restaurant.routes'));
app.use('/api/v1/products',         require('./modules/product/product.routes'));
app.use('/api/v1/cart',             require('./modules/cart/cart.routes'));
app.use('/api/v1/orders',           require('./modules/order/order.routes'));
app.use('/api/v1/wallet',           require('./modules/wallet/wallet.routes'));
app.use('/api/v1/wishlist',         require('./modules/wishlist/wishlist.routes'));
app.use('/api/v1/reviews',          require('./modules/review/review.routes'));
app.use('/api/v1/support',          require('./modules/support/support.routes'));
app.use('/api/v1/restaurant-panel', require('./modules/restaurant-panel/restaurant-panel.routes'));
app.use('/api/v1/retailer',         require('./modules/retailer/retailer.routes'));
app.use('/api/v1/supplier',         require('./modules/supplier-panel/supplier-panel.routes'));
app.use('/api/v1/delivery',         require('./modules/delivery-panel/delivery-panel.routes'));
app.use('/api/v1/admin',            require('./modules/admin-panel/admin-panel.routes'));
app.use('/api/v1/admin/seed',       require('./modules/admin-panel/seed.routes'));

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({
  success: false,
  message: `Route ${req.method} ${req.originalUrl} not found.`,
  hint: 'Base URL is /api/v1 — example: /api/v1/auth/register'
}));

// ─── GLOBAL ERROR HANDLER ────────────────────────────────────────────────────
app.use(require('./middlewares/error.middleware'));

module.exports = app;
