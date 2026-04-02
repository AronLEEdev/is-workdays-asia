import { useDb } from "../utils/db";
import { validateApiKey, InvalidApiKeyError, type ApiKeyRow } from "../utils/validateApiKey";

export default defineEventHandler(async (event) => {
  if (!event.path.startsWith("/v1/")) return;

  const rawKey = getHeader(event, "x-api-key");
  if (!rawKey) {
    throw createError({ statusCode: 401, message: "Missing X-API-Key header" });
  }

  const sql = useDb();
  try {
    event.context.apiKey = await validateApiKey(rawKey, async (keyHash) => {
      const rows = await sql`
        SELECT id, user_email, tier, requests_this_month, revoked_at
        FROM api_keys
        WHERE key_hash = ${keyHash}
        LIMIT 1
      `;
      return rows[0] as ApiKeyRow | undefined;
    });
  } catch (e) {
    if (e instanceof InvalidApiKeyError) {
      throw createError({ statusCode: 401, message: e.message });
    }
    throw e;
  }
});
