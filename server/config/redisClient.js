// server/config/redisClient.js
const Redis = require("ioredis");
const redis = new Redis(process.env.REDIS_URI);

// for cli
// brew install redis
// redis-cli -u "redis://default:BubmDiGZUiJsLq892VOF2NNqfMBxPqZL@redis-19926.c305.ap-south-1-1.ec2.redns.redis-cloud.com:19926"

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

async function delHash(key, field) {
  await redis.hdel(key, field);
}

const delKey = async (key) => {
  return redis.del(prefixedKey(key));
};

const hashExists = async (key, field) => {
  const n = await redis.hexists(prefixedKey(key), field); // returns 1 or 0
  return n === 1;
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
  delHash,
  delKey,
  hashExists,
  raw: redis,
};
