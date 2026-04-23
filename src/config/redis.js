/**
 * Redis Configuration
 * Used for: session caching, rate limiting store, OTP storage, refresh token blacklist
 */

let redisClient = null;
let isRedisConnected = false;

// Graceful Redis with fallback — if Redis not available, app still works
const connectRedis = async () => {
  if (process.env.REDIS_URL) {
    try {
      const { createClient } = require('redis');
      redisClient = createClient({ url: process.env.REDIS_URL, socket: { reconnectStrategy: (retries) => Math.min(retries * 50, 2000) } });
      redisClient.on('error', (err) => { if (process.env.NODE_ENV !== 'test') console.warn('⚠️  Redis error (non-fatal):', err.message); });
      redisClient.on('connect', () => { isRedisConnected = true; console.log('✅ Redis Connected'); });
      await redisClient.connect();
    } catch (err) {
      console.warn('⚠️  Redis unavailable — running without cache:', err.message);
      redisClient = null;
    }
  } else {
    console.log('ℹ️  REDIS_URL not set — Redis disabled (set REDIS_URL in .env to enable)');
  }
};

/**
 * In-memory fallback store (used when Redis is not available)
 */
const memStore = new Map();

const cache = {
  get: async (key) => {
    if (redisClient && isRedisConnected) {
      const val = await redisClient.get(key);
      return val ? JSON.parse(val) : null;
    }
    const item = memStore.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) { memStore.delete(key); return null; }
    return item.value;
  },
  set: async (key, value, ttlSeconds = 3600) => {
    if (redisClient && isRedisConnected) {
      await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
      return;
    }
    memStore.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  },
  del: async (key) => {
    if (redisClient && isRedisConnected) { await redisClient.del(key); return; }
    memStore.delete(key);
  },
  exists: async (key) => {
    if (redisClient && isRedisConnected) { return (await redisClient.exists(key)) === 1; }
    return memStore.has(key);
  },
};

module.exports = { connectRedis, cache, getRedisClient: () => redisClient, isConnected: () => isRedisConnected };