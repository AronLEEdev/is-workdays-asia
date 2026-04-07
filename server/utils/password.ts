// server/utils/password.ts
import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const SALT_BYTES = 16;
const KEY_BYTES = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES).toString("hex");
  const key = (await scryptAsync(password, salt, KEY_BYTES)) as Buffer;
  return `${salt}:${key.toString("hex")}`;
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  const [salt, storedKey] = hash.split(":");
  if (!salt || !storedKey) return false;
  const key = (await scryptAsync(password, salt, KEY_BYTES)) as Buffer;
  const storedKeyBuf = Buffer.from(storedKey, "hex");
  if (key.length !== storedKeyBuf.length) return false;
  return timingSafeEqual(key, storedKeyBuf);
}
