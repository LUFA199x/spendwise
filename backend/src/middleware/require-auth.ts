import { createMiddleware } from "hono/factory";
import { auth } from "../auth.js";
import { sessionCache } from "../session-cache.js";

export type AuthVars = { userId: string };

export const requireAuth = createMiddleware<{ Variables: AuthVars }>(
  async (c, next) => {
    const cached = await sessionCache.read(c.req.raw.headers);
    if (cached) {
      c.set("userId", cached);
      return next();
    }

    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: "Unauthorized" }, 401);

    await sessionCache.write(c.req.raw.headers, session.user.id);
    c.set("userId", session.user.id);
    await next();
  }
);
