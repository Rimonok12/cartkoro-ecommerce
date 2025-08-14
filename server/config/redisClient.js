// server/config/redisClient.js
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URI);

const PROJECT_PREFIX = process.env.REDIS_PREFIX || '';

const prefixedKey = (key) => `${PROJECT_PREFIX}${key}`;

// Utility functions
const set = async (key, value, expirySec) => {
  return redis.set(prefixedKey(key), JSON.stringify(value), 'EX', expirySec);
};

const get = async (key) => {
  const val = await redis.get(prefixedKey(key));
  return val ? JSON.parse(val) : null;
};

const connectRedis = async () => {
  try {
    await redis.ping(); // Test connection
    console.log('Redis connected');
  } catch (err) {
    console.error('Redis connection error:', err.message);
    process.exit(1);
  }
};

module.exports = {
  connectRedis,
  set,
  get,
  raw: redis,
};
