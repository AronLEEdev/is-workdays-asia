import Redis from "ioredis";

let redis: Redis;

export function useRedis(): Redis {
  if (!redis) {
    const config = useRuntimeConfig();
    redis = new Redis(config.redisUrl as string);
  }
  return redis;
}
