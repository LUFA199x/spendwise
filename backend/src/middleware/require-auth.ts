import { createMiddleware } from "hono/factory";
import { auth } from "../auth.js";
import { redis } from "../redis.js";

export type AuthVars = { userId: string };

const SESSION_TTL = 300; // 5 minutes

export const requireAuth = createMiddleware<{ Variables: AuthVars }>(
  async (c, next) => {
    const sessionToken =
      c.req.header("Authorization")?.replace("Bearer ", "") ??
      c.req.raw.headers.get("cookie") ?? "";

    const cacheKey = `session:${sessionToken}`;
    const cached = await redis.get(cacheKey).catch(() => null);

    if (cached) {
      c.set("userId", cached);
      return next();
    }

    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: "Unauthorized" }, 401);

    await redis.set(cacheKey, session.user.id, "EX", SESSION_TTL).catch(() => {});
    c.set("userId", session.user.id);
    await next();
  }
);
