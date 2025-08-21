// server/config/redisClient.js
const Redis = require("ioredis");
const redis = new Redis(process.env.REDIS_URI);

const PROJECT_PREFIX = process.env.REDIS_PREFIX || "";

const prefixedKey = (key) => `${PROJECT_PREFIX}${key}`;

const setHash = async (key, field, value, expirySec) => {
  await redis.hset(prefixedKey(key), field, JSON.stringify(value));
  if (expirySec) {
    await redis.expire(prefixedKey(key), expirySec);
  }
};

const getHash = async (key, field) => {
  const val = await redis.hget(prefixedKey(key), field);
  return val ? JSON.parse(val) : null;
};

const getAllHash = async (key) => {
  const data = await redis.hgetall(prefixedKey(key));
  const parsed = {};
  for (const f in data) {
    parsed[f] = JSON.parse(data[f]);
  }
  return parsed;
};

const delKey = async (key) => {
  return redis.del(prefixedKey(key));
};

const connectRedis = async () => {
  try {
    await redis.ping();
    console.log("Redis connected");
  } catch (err) {
    console.error("Redis connection error:", err.message);
    process.exit(1);
  }
};

module.exports = {
  connectRedis,
  setHash,
  getHash,
  getAllHash,
  delKey,
  raw: redis,
};
