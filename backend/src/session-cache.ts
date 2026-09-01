import { redis } from "./redis.js";

const PREFIX = "session:";
const TTL = 300; // seconds

/**
 * Derive the session token from request headers.
 *
 * Order: `Authorization: Bearer <token>` → the `better-auth.session_token`
 * cookie → the raw cookie header. Returns null when nothing usable is
 * present, so an anonymous request can never share a cache key with
 * another anonymous request.
 */
export function deriveToken(headers: Headers): string | null {
  const authHeader = headers.get("authorization")?.replace("Bearer ", "");
  const cookieHeader = headers.get("cookie") ?? "";
  const token =
    authHeader ??
    cookieHeader
      .split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith("better-auth.session_token="))
      ?.split("=")[1] ??
    cookieHeader;
  return token ? token : null;
}

export function cacheKey(headers: Headers): string | null {
  const token = deriveToken(headers);
  return token ? PREFIX + token : null;
}

/**
 * The session cache. Owns token derivation, the key format, the TTL, and
 * the policy that a Redis failure degrades to a cache miss rather than an
 * error. Callers never name Redis.
 */
export const sessionCache = {
  async read(headers: Headers): Promise<string | null> {
    const key = cacheKey(headers);
    if (!key) return null;
    return (await redis?.get<string>(key).catch(() => null)) ?? null;
  },

  async write(headers: Headers, userId: string): Promise<void> {
    const key = cacheKey(headers);
    if (!key) return;
    await redis?.set(key, userId, { ex: TTL }).catch(() => {});
  },

  async invalidate(headers: Headers): Promise<void> {
    const key = cacheKey(headers);
    if (!key) return;
    await redis?.del(key).catch(() => {});
  },
};
