const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

// Security & utilities
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// ─── ROUTES ─────
app.use('/api/v1/auth',           require('./modules/auth/auth.routes'));
app.use('/api/v1/users',          require('./modules/user/user.routes'));
//app.use('/api/v1/referral',       require('./modules/user/referral.routes'));
app.use('/api/v1/restaurants',    require('./modules/restaurant/restaurant.routes'));
app.use('/api/v1/products',       require('./modules/product/product.routes'));
app.use('/api/v1/cart',           require('./modules/cart/cart.routes'));
app.use('/api/v1/orders',         require('./modules/order/order.routes'));
// app.use('/api/v1/wallet',         require('./modules/wallet/wallet.routes'));
// app.use('/api/v1/wishlist',       require('./modules/wishlist/wishlist.routes'));
// app.use('/api/v1/reviews',        require('./modules/review/review.routes'));
// app.use('/api/v1/retailer',       require('./modules/retailer/retailer.routes'));
// app.use('/api/v1/supplier',       require('./modules/supplier/supplier.routes'));
// app.use('/api/v1/delivery',       require('./modules/delivery/delivery.routes'));
// app.use('/api/v1/support',        require('./modules/support/support.routes'));
// app.use('/api/v1/admin',          require('./modules/admin/admin.routes'));

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, message: 'HubNepa API is running.', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// Global error handler
app.use(errorHandler);

module.exports = app;