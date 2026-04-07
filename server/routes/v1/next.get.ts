import { useDb } from "../../utils/db";
import { lookupDaysInRange } from "../../utils/lookupDays";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const { country, date, skip: skipParam } = query;

  if (!country || !date) {
    throw createError({
      statusCode: 400,
      message: "Missing required parameters: country, date",
    });
  }

  if (country !== "CN") {
    throw createError({
      statusCode: 400,
      message: `Unsupported country: ${country}. Supported: CN`,
    });
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date as string)) {
    throw createError({
      statusCode: 400,
      message: "Invalid date format. Use YYYY-MM-DD",
    });
  }

  const parsedDate = new Date(date as string + "T00:00:00Z");
  if (isNaN(parsedDate.getTime())) {
    throw createError({ statusCode: 400, message: `Invalid date: ${date}` });
  }

  const skip = skipParam === undefined ? 1 : Number(skipParam);
  if (!Number.isInteger(skip) || skip < 1 || skip > 30) {
    throw createError({
      statusCode: 400,
      message: "skip must be an integer between 1 and 30",
    });
  }

  const windowSize = skip * 14 + 14;
  const windowStart = new Date(parsedDate);
  windowStart.setUTCDate(windowStart.getUTCDate() + 1);
  const windowEnd = new Date(windowStart);
  windowEnd.setUTCDate(windowEnd.getUTCDate() + windowSize - 1);

  const fromStr = windowStart.toISOString().slice(0, 10);
  const toStr = windowEnd.toISOString().slice(0, 10);

  const sql = useDb();
  const days = await lookupDaysInRange(sql, country as string, fromStr, toStr);

  const workingDays = days.filter((d) => d.is_working);
  if (workingDays.length < skip) {
    throw createError({
      statusCode: 422,
      message: "No working day found within search window",
    });
  }

  return {
    from: date,
    next_working_day: workingDays[skip - 1].date,
    working_days_skipped: skip,
    country,
  };
});
