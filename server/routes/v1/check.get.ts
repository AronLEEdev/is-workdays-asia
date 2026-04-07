import { useDb } from "../../utils/db";
import { lookupDaysInRange } from "../../utils/lookupDays";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const { country, date } = query;

  if (!country || !date) {
    throw createError({
      statusCode: 400,
      message: "Missing required parameters: country, date",
    });
  }

  const validCountries = ["CN"];
  if (!validCountries.includes(country as string)) {
    throw createError({
      statusCode: 400,
      message: `Unsupported country: ${country}. Supported: ${validCountries.join(", ")}`,
    });
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date as string)) {
    throw createError({
      statusCode: 400,
      message: "Invalid date format. Use YYYY-MM-DD",
    });
  }

  if (isNaN(new Date(date as string + "T00:00:00Z").getTime())) {
    throw createError({ statusCode: 400, message: `Invalid date: ${date}` });
  }

  const sql = useDb();
  const days = await lookupDaysInRange(sql, country as string, date as string, date as string);
  if (!days[0]) {
    throw createError({ statusCode: 500, message: "Unexpected empty result" });
  }
  return days[0];
});
