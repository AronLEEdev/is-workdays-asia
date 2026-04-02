import { createHash } from "crypto";
import { describe, it, expect, vi } from "vitest";
import { validateApiKey, InvalidApiKeyError, type ApiKeyRow } from "../../../server/utils/validateApiKey";

const makeRow = (overrides: Partial<ApiKeyRow> = {}): ApiKeyRow => ({
  id: 1,
  user_email: "test@example.com",
  tier: "free",
  requests_this_month: 0,
  revoked_at: null,
  ...overrides,
});

const sha256 = (input: string) =>
  createHash("sha256").update(input).digest("hex");

describe("validateApiKey", () => {
  it("returns key row for a valid, active key", async () => {
    const row = makeRow();
    const lookup = vi.fn().mockResolvedValue(row);

    const result = await validateApiKey("my-secret-key", lookup);

    expect(result).toBe(row);
  });

  it("calls lookup with the SHA-256 hash of the raw key", async () => {
    const lookup = vi.fn().mockResolvedValue(makeRow());
    await validateApiKey("my-secret-key", lookup);

    expect(lookup).toHaveBeenCalledWith(sha256("my-secret-key"));
  });

  it("throws InvalidApiKeyError when key is not found", async () => {
    const lookup = vi.fn().mockResolvedValue(undefined);

    await expect(validateApiKey("bad-key", lookup)).rejects.toThrow(
      InvalidApiKeyError
    );
  });

  it("throws InvalidApiKeyError when key is revoked", async () => {
    const lookup = vi.fn().mockResolvedValue(makeRow({ revoked_at: new Date() }));

    await expect(validateApiKey("revoked-key", lookup)).rejects.toThrow(
      InvalidApiKeyError
    );
  });

  it("does not throw when revoked_at is null", async () => {
    const lookup = vi.fn().mockResolvedValue(makeRow({ revoked_at: null }));

    await expect(validateApiKey("valid-key", lookup)).resolves.not.toThrow();
  });
});
