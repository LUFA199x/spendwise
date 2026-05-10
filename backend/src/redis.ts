import { Redis } from "@upstash/redis";

// null when env vars are absent — every call site uses optional chaining
// so the app runs normally without Redis (caching is simply skipped).
export const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url:   process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;
