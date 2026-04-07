export type UserRow = {
  id: number;
  email: string;
  name: string | null;
  password_hash: string | null;
};

/**
 * Finds or creates a user for an OAuth login, with account linking by email.
 *
 * IMPORTANT: `createUser` and `linkOAuth` are called sequentially with no
 * transaction guarantee. Callers must ensure both callbacks use the same
 * DB transaction, or accept the risk of an orphaned user row if `linkOAuth`
 * fails after `createUser` succeeds.
 */
export async function findOrCreateUser(
  lookupByOAuth: (provider: string, providerId: string) => Promise<UserRow | undefined>,
  lookupByEmail: (email: string) => Promise<UserRow | undefined>,
  createUser: (email: string, name: string | null) => Promise<UserRow>,
  linkOAuth: (userId: number, provider: string, providerId: string) => Promise<void>,
  provider: string,
  providerId: string,
  email: string,
  name: string | null,
): Promise<UserRow> {
  const existingByOAuth = await lookupByOAuth(provider, providerId);
  if (existingByOAuth) return existingByOAuth;

  const existingByEmail = await lookupByEmail(email);
  if (existingByEmail) {
    await linkOAuth(existingByEmail.id, provider, providerId);
    return existingByEmail;
  }

  const newUser = await createUser(email, name);
  await linkOAuth(newUser.id, provider, providerId);
  return newUser;
}
