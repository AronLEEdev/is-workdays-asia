import { checkRateLimit, RateLimitExceededError } from "../utils/checkRateLimit";
import { useRedis } from "../utils/redis";

export default defineEventHandler(async (event) => {
  if (!event.path.startsWith("/v1/")) return;

  const { id, tier } = event.context.apiKey;

  try {
    await checkRateLimit(id, tier, useRedis());
  } catch (e) {
    if (e instanceof RateLimitExceededError) {
      throw createError({ statusCode: 429, message: "Monthly request limit exceeded" });
    }
    console.error("[rateLimit] Redis error, failing open:", e);
  }
});
