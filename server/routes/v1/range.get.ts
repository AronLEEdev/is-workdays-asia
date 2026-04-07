import { useDb } from "../../utils/db";
import { lookupDaysInRange } from "../../utils/lookupDays";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const { country, from, to } = query;

  if (!country || !from || !to) {
    throw createError({
      statusCode: 400,
      message: "Missing required parameters: country, from, to",
    });
  }

  if (country !== "CN") {
    throw createError({
      statusCode: 400,
      message: `Unsupported country: ${country}. Supported: CN`,
    });
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(from as string) || !dateRegex.test(to as string)) {
    throw createError({
      statusCode: 400,
      message: "Invalid date format. Use YYYY-MM-DD",
    });
  }

  const fromDate = new Date(from as string + "T00:00:00Z");
  const toDate = new Date(to as string + "T00:00:00Z");

  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    throw createError({ statusCode: 400, message: "Invalid date" });
  }

  if (fromDate > toDate) {
    throw createError({
      statusCode: 400,
      message: "'from' must be before or equal to 'to'",
    });
  }

  const spanDays = Math.round((toDate.getTime() - fromDate.getTime()) / 86400000) + 1;
  if (spanDays > 366) {
    throw createError({
      statusCode: 400,
      message: "Date range cannot exceed 366 days",
    });
  }

  const sql = useDb();
  const days = await lookupDaysInRange(sql, country as string, from as string, to as string);

  const workingDays = days.filter((d) => d.is_working).length;

  return {
    country,
    from,
    to,
    total_days: days.length,
    working_days: workingDays,
    non_working_days: days.length - workingDays,
    days: days.map(({ date, is_working, day_type, name_en, name_local }) => ({
      date,
      is_working,
      day_type,
      name_en,
      name_local,
    })),
  };
});
