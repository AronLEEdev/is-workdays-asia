import { useDb } from "../../utils/db";
import { findOrCreateUser, type UserRow } from "../../utils/findOrCreateUser";

export default defineOAuthGitHubEventHandler({
  async onSuccess(event, { user: githubUser }) {
    const email = githubUser.email;
    if (!email) return sendRedirect(event, "/login?error=no_email");

    const sql = useDb();

    const user = await sql.begin(async (txSql) => {
      return await findOrCreateUser(
        async (provider, providerId) => {
          const rows = await txSql<UserRow[]>`
            SELECT u.id, u.email, u.name, u.password_hash
            FROM oauth_accounts oa
            JOIN users u ON u.id = oa.user_id
            WHERE oa.provider = ${provider} AND oa.provider_id = ${providerId}
            LIMIT 1
          `;
          return rows[0];
        },
        async (em) => {
          const rows = await txSql<UserRow[]>`
            SELECT id, email, name, password_hash FROM users WHERE email = ${em} LIMIT 1
          `;
          return rows[0];
        },
        async (em, name) => {
          const rows = await txSql<UserRow[]>`
            INSERT INTO users (email, name) VALUES (${em}, ${name})
            RETURNING id, email, name, password_hash
          `;
          const row = rows[0];
          if (!row) throw new Error("User insert returned no rows");
          return row;
        },
        async (userId, provider, providerId) => {
          await txSql`
            INSERT INTO oauth_accounts (user_id, provider, provider_id)
            VALUES (${userId}, ${provider}, ${providerId})
            ON CONFLICT (provider, provider_id) DO NOTHING
          `;
        },
        "github",
        String(githubUser.id),
        email,
        githubUser.name ?? githubUser.login ?? null,
      );
    });

    await setUserSession(event, {
      user: { id: user.id, email: user.email, name: user.name },
    });

    return sendRedirect(event, "/dashboard");
  },
  onError(event, error) {
    console.error("GitHub OAuth error:", error);
    return sendRedirect(event, "/login?error=oauth");
  },
});
