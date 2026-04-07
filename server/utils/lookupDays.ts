import type { Sql } from "postgres";

export type DayEntry = {
  date: string;
  country: string;
  is_working: boolean;
  day_type: "working" | "holiday" | "makeup" | "weekend";
  name_en: string | null;
  name_local: string | null;
};

export function resolveDay(dateStr: string, country: string, entry?: DayEntry): DayEntry {
  if (entry) return entry;
  const d = new Date(dateStr + "T00:00:00Z");
  const isWeekend = d.getUTCDay() === 0 || d.getUTCDay() === 6;
  return {
    date: dateStr,
    country,
    is_working: !isWeekend,
    day_type: isWeekend ? "weekend" : "working",
    name_en: null,
    name_local: null,
  };
}

export async function lookupDaysInRange(
  sql: Sql,
  country: string,
  from: string,
  to: string,
): Promise<DayEntry[]> {
  const rows = await sql<DayEntry[]>`
    SELECT
      e.date::text AS date,
      e.country,
      e.is_working,
      e.day_type,
      e.name_en,
      e.name_local
    FROM calendar_entries e
    JOIN calendar_years y ON y.id = e.year_id
    WHERE e.country = ${country}
      AND e.date >= ${from}
      AND e.date <= ${to}
      AND y.status = 'published'
  `;

  const entryMap = new Map<string, DayEntry>();
  for (const row of rows) {
    entryMap.set(row.date, row);
  }

  const days: DayEntry[] = [];
  const current = new Date(from + "T00:00:00Z");
  const end = new Date(to + "T00:00:00Z");

  while (current <= end) {
    const dateStr = current.toISOString().slice(0, 10);
    days.push(resolveDay(dateStr, country, entryMap.get(dateStr)));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return days;
}
