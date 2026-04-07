// server/api/dashboard/keys.get.ts
import { useDb } from "../../utils/db";

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const sql = useDb();

  const rows = await sql`
    SELECT id, tier, requests_this_month, created_at, last_used
    FROM api_keys
    WHERE user_email = ${session.user.email}
      AND revoked_at IS NULL
    ORDER BY created_at DESC
  `;

  return rows;
});
