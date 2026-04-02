import { useDb } from "../../utils/db";

export default defineEventHandler(async () => {
  const sql = useDb();

  const result = await sql`
    SELECT COUNT(*) as count
    FROM calendar_entries
    WHERE country = 'CN'
  `;

  return {
    status: "ok",
    db: "connected",
    cn_entries: result[0]?.count ?? 0,
  };
});
