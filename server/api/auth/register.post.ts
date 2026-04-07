// server/api/auth/register.post.ts
import { useDb } from "../../utils/db";
import { hashPassword } from "../../utils/password";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { email, password, name } = body ?? {};

  if (!email || !password) {
    throw createError({ statusCode: 400, message: "email and password are required" });
  }
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, message: "Invalid email format" });
  }
  if (typeof password !== "string" || password.length < 8) {
    throw createError({ statusCode: 400, message: "Password must be at least 8 characters" });
  }

  const sql = useDb();
  const existing = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
  if (existing.length > 0) {
    throw createError({ statusCode: 409, message: "Email already registered" });
  }

  const password_hash = await hashPassword(password);
  const rows = await sql`
    INSERT INTO users (email, name, password_hash)
    VALUES (${email}, ${name ?? null}, ${password_hash})
    RETURNING id, email, name
  `;
  const user = rows[0];
  if (!user) throw new Error("User insert returned no rows");

  await setUserSession(event, {
    user: { id: user.id, email: user.email, name: user.name },
  });

  return { user: { id: user.id, email: user.email, name: user.name } };
});
