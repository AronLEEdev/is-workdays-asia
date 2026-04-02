// TODO: GET /v1/check — Query params: country (TW|CN), date (YYYY-MM-DD). Return single-date
// working-day info (date, country, is_working_day, day_type, name, name_local, makeup_workday_for).
// Validate params and return 4xx on invalid date or unsupported country; use auth + rateLimit middleware.
import { useDb } from "../../utils/db";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  // 参数验证
  const { country, date } = query;

  if (!country || !date) {
    throw createError({
      statusCode: 400,
      message: "Missing required parameters: country, date",
    });
  }

  // 验证country格式
  const validCountries = ["CN"];
  if (!validCountries.includes(country as string)) {
    throw createError({
      statusCode: 400,
      message: `Unsupported country: ${country}. Supported: ${validCountries.join(", ")}`,
    });
  }

  // 验证date格式
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date as string)) {
    throw createError({
      statusCode: 400,
      message: "Invalid date format. Use YYYY-MM-DD",
    });
  }

  const parsedDate = new Date(date as string);
  if (isNaN(parsedDate.getTime())) {
    throw createError({
      statusCode: 400,
      message: `Invalid date: ${date}`,
    });
  }

  const sql = useDb();

  // 查询数据库，只查published的数据
  const result = await sql`
    SELECT 
      e.date,
      e.country,
      e.is_working,
      e.day_type,
      e.name_en,
      e.name_local
    FROM calendar_entries e
    JOIN calendar_years y ON y.id = e.year_id
    WHERE e.country = ${country as string}
      AND e.date = ${date as string}
      AND y.status = 'published'
    LIMIT 1
  `;

  // 查到记录 → 直接返回
  if (result.length > 0) {
    const entry = result[0];
    return {
      date: entry.date,
      country: entry.country,
      is_working: entry.is_working,
      day_type: entry.day_type,
      name_en: entry.name_en,
      name_local: entry.name_local,
    };
  }

  // 没有记录 → 根据星期几推断
  const dayOfWeek = parsedDate.getDay(); // 0=周日, 6=周六
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  return {
    date: date,
    country: country,
    is_working: !isWeekend,
    day_type: isWeekend ? "weekend" : "working",
    name_en: null,
    name_local: null,
  };
});
