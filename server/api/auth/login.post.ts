// server/api/auth/login.post.ts
import { useDb } from "../../utils/db";
import { verifyPassword } from "../../utils/password";

// Constant dummy hash used when no user is found to prevent timing attacks
// Salt: 32 hex chars (16 bytes = SALT_BYTES), Key: 128 hex chars (64 bytes = KEY_BYTES)
const DUMMY_HASH = "00000000000000000000000000000000:00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { email, password } = body ?? {};

  if (!email || !password) {
    throw createError({ statusCode: 400, message: "email and password are required" });
  }

  const sql = useDb();
  const rows = await sql`
    SELECT id, email, name, password_hash FROM users WHERE email = ${email} LIMIT 1
  `;
  const user = rows[0];

  const hashToCheck = user?.password_hash ?? DUMMY_HASH;
  const passwordOk = await verifyPassword(hashToCheck, password);

  if (!user || !user.password_hash || !passwordOk) {
    throw createError({ statusCode: 401, message: "Invalid credentials" });
  }

  await setUserSession(event, {
    user: { id: user.id, email: user.email, name: user.name },
  });

  return { user: { id: user.id, email: user.email, name: user.name } };
});
