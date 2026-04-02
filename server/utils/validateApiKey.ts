import { createHash } from "crypto";

export type ApiKeyRow = {
  id: number | string;
  user_email: string;
  tier: "free" | "pro";
  requests_this_month: number;
  revoked_at: Date | string | null;
};

export class InvalidApiKeyError extends Error {
  constructor() {
    super("Invalid or revoked API key");
    this.name = "InvalidApiKeyError";
  }
}

export async function validateApiKey(
  rawKey: string,
  lookup: (keyHash: string) => Promise<ApiKeyRow | undefined>
): Promise<ApiKeyRow> {
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const row = await lookup(keyHash);
  if (!row || row.revoked_at !== null) {
    throw new InvalidApiKeyError();
  }
  return row;
}
