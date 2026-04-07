// server/api/dashboard/keys.[id].delete.ts
import { useDb } from "../../utils/db";

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const id = getRouterParam(event, "id");
  const sql = useDb();

  const rows = await sql`
    UPDATE api_keys
    SET revoked_at = NOW()
    WHERE id = ${id}
      AND user_email = ${session.user.email}
      AND revoked_at IS NULL
    RETURNING id
  `;

  if (rows.length === 0) {
    throw createError({ statusCode: 404, message: "Key not found" });
  }

  setResponseStatus(event, 204);
  return null;
});
