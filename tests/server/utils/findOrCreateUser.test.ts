import { describe, it, expect, vi } from "vitest";
import { findOrCreateUser, type UserRow } from "../../../server/utils/findOrCreateUser";

const makeUser = (overrides: Partial<UserRow> = {}): UserRow => ({
  id: 1,
  email: "test@example.com",
  name: "Test User",
  password_hash: null,
  ...overrides,
});

describe("findOrCreateUser", () => {
  it("returns existing user when OAuth account is found", async () => {
    const user = makeUser();
    const lookupByOAuth = vi.fn().mockResolvedValue(user);
    const lookupByEmail = vi.fn();
    const createUser = vi.fn();
    const linkOAuth = vi.fn();

    const result = await findOrCreateUser(
      lookupByOAuth, lookupByEmail, createUser, linkOAuth,
      "github", "12345", "test@example.com", "Test User",
    );

    expect(result).toBe(user);
    expect(lookupByEmail).not.toHaveBeenCalled();
    expect(createUser).not.toHaveBeenCalled();
    expect(linkOAuth).not.toHaveBeenCalled();
  });

  it("links OAuth to existing user when email already exists", async () => {
    const user = makeUser();
    const lookupByOAuth = vi.fn().mockResolvedValue(undefined);
    const lookupByEmail = vi.fn().mockResolvedValue(user);
    const createUser = vi.fn();
    const linkOAuth = vi.fn().mockResolvedValue(undefined);

    const result = await findOrCreateUser(
      lookupByOAuth, lookupByEmail, createUser, linkOAuth,
      "github", "12345", "test@example.com", "Test User",
    );

    expect(result).toBe(user);
    expect(lookupByEmail).toHaveBeenCalledWith("test@example.com");
    expect(linkOAuth).toHaveBeenCalledWith(1, "github", "12345");
    expect(createUser).not.toHaveBeenCalled();
  });

  it("creates new user and links OAuth when neither exist", async () => {
    const newUser = makeUser({ id: 2, email: "new@example.com" });
    const lookupByOAuth = vi.fn().mockResolvedValue(undefined);
    const lookupByEmail = vi.fn().mockResolvedValue(undefined);
    const createUser = vi.fn().mockResolvedValue(newUser);
    const linkOAuth = vi.fn().mockResolvedValue(undefined);

    const result = await findOrCreateUser(
      lookupByOAuth, lookupByEmail, createUser, linkOAuth,
      "google", "99999", "new@example.com", "New User",
    );

    expect(createUser).toHaveBeenCalledWith("new@example.com", "New User");
    expect(linkOAuth).toHaveBeenCalledWith(2, "google", "99999");
    expect(result).toBe(newUser);
  });
});
