// server/api/demo/check.get.ts
import { useDb } from "../../utils/db";
import { useRedis } from "../../utils/redis";
import { lookupDaysInRange } from "../../utils/lookupDays";

const DEMO_LIMIT = 30;

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? "unknown";
  const hour = Math.floor(Date.now() / 3_600_000);
  const redisKey = `demo:rl:${ip}:${hour}`;

  const redis = useRedis();
  const count = await redis.incr(redisKey);
  if (count === 1) await redis.expire(redisKey, 3600);
  if (count > DEMO_LIMIT) {
    throw createError({ statusCode: 429, message: "Demo rate limit exceeded. Please sign up for an API key." });
  }

  const query = getQuery(event);
  const { country, date } = query;

  if (!country || !date) {
    throw createError({ statusCode: 400, message: "Missing required parameters: country, date" });
  }

  if (country !== "CN") {
    throw createError({ statusCode: 400, message: "Unsupported country. Supported: CN" });
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date as string) || isNaN(new Date(date as string + "T00:00:00Z").getTime())) {
    throw createError({ statusCode: 400, message: "Invalid date format. Use YYYY-MM-DD" });
  }

  const sql = useDb();
  const days = await lookupDaysInRange(sql, country as string, date as string, date as string);
  if (!days[0]) {
    throw createError({ statusCode: 500, message: "Unexpected empty result" });
  }
  return days[0];
});
