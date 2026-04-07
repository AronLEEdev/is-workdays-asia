// server/api/dashboard/keys.post.ts
import { createHash, randomBytes } from "node:crypto";
import { useDb } from "../../utils/db";

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const sql = useDb();

  const rawKey = randomBytes(32).toString("hex");
  const keyHash = createHash("sha256").update(rawKey).digest("hex");

  const rows = await sql`
    INSERT INTO api_keys (key_hash, user_email, tier)
    VALUES (${keyHash}, ${session.user.email}, 'free')
    RETURNING id, tier, created_at
  `;
  const key = rows[0];
  if (!key) throw new Error("api_keys insert returned no rows");

  return { id: key.id, key: rawKey, tier: key.tier, created_at: key.created_at };
});
