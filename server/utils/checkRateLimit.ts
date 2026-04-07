export const FREE_TIER_LIMIT = 500;
const TTL_SECONDS = 40 * 24 * 3600;

export class RateLimitExceededError extends Error {
  constructor() {
    super("Monthly request limit exceeded");
    this.name = "RateLimitExceededError";
  }
}

export interface RateLimitRedis {
  pipeline(): {
    incr(key: string): unknown;
    expire(key: string, seconds: number): unknown;
    exec(): Promise<[Error | null, unknown][] | null>;
  };
}

function monthKey(keyId: string | number): string {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return `rl:${keyId}:${month}`;
}

export async function checkRateLimit(
  keyId: string | number,
  tier: "free" | "pro",
  redis: RateLimitRedis,
): Promise<void> {
  if (tier === "pro") return;

  const key = monthKey(keyId);
  const pipeline = redis.pipeline();
  pipeline.incr(key);
  pipeline.expire(key, TTL_SECONDS);
  const results = await pipeline.exec();
  const count = (results?.[0]?.[1] ?? 0) as number;

  if (count > FREE_TIER_LIMIT) {
    throw new RateLimitExceededError();
  }
}
