require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  // Connect MongoDB — required
  await connectDB();

  // Connect Redis — optional, never crashes app
  await connectRedis();

  // Start listening
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 HubNepa API running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/v1/health\n`);
  });

  return server;
};

startServer().catch((err) => {
  console.error('\n❌ Failed to start server:', err.message);
  console.error('Fix: Set a valid MONGO_URI in your .env file');
  console.error('For local: MONGO_URI=mongodb://localhost:27017/hubnepa (MongoDB must be running)');
  console.error('For cloud: Use MongoDB Atlas connection string\n');
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});