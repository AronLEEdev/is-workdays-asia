import { describe, it, expect, vi } from "vitest";
import {
  checkRateLimit,
  RateLimitExceededError,
  FREE_TIER_LIMIT,
} from "../../../server/utils/checkRateLimit";

const makeRedis = (incrResult: number) => ({
  pipeline: vi.fn(() => ({
    incr: vi.fn(),
    expire: vi.fn(),
    exec: vi.fn().mockResolvedValue([[null, incrResult], [null, 1]]),
  })),
});

describe("checkRateLimit", () => {
  it("passes when free key count is under the limit", async () => {
    const redis = makeRedis(1);
    await expect(checkRateLimit(42, "free", redis)).resolves.toBeUndefined();
  });

  it("passes when free key count is exactly at the limit", async () => {
    const redis = makeRedis(FREE_TIER_LIMIT);
    await expect(checkRateLimit(42, "free", redis)).resolves.toBeUndefined();
  });

  it("throws RateLimitExceededError when free key count exceeds the limit", async () => {
    const redis = makeRedis(FREE_TIER_LIMIT + 1);
    await expect(checkRateLimit(42, "free", redis)).rejects.toThrow(
      RateLimitExceededError
    );
  });

  it("skips Redis entirely for pro keys", async () => {
    const redis = makeRedis(9999);
    await checkRateLimit(42, "pro", redis);
    expect(redis.pipeline).not.toHaveBeenCalled();
  });

  it("uses the correct monthly Redis key format rl:{id}:{YYYY-MM}", async () => {
    const incrSpy = vi.fn();
    const redis = {
      pipeline: () => ({
        incr: incrSpy,
        expire: vi.fn(),
        exec: vi.fn().mockResolvedValue([[null, 1], [null, 1]]),
      }),
    };
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    await checkRateLimit(42, "free", redis);

    expect(incrSpy).toHaveBeenCalledWith(`rl:42:${month}`);
  });

  it("sets expire on every request (not just first)", async () => {
    const expireSpy = vi.fn();
    const redis = {
      pipeline: () => ({
        incr: vi.fn(),
        expire: expireSpy,
        exec: vi.fn().mockResolvedValue([[null, 250], [null, 1]]),
      }),
    };

    await checkRateLimit(42, "free", redis);

    expect(expireSpy).toHaveBeenCalledOnce();
  });

  it("propagates Redis errors so the middleware can fail-open", async () => {
    const redis = {
      pipeline: () => ({
        incr: vi.fn(),
        expire: vi.fn(),
        exec: vi.fn().mockRejectedValue(new Error("Redis connection refused")),
      }),
    };

    await expect(checkRateLimit(42, "free", redis)).rejects.toThrow(
      "Redis connection refused"
    );
  });
});
