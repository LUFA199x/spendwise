import { createMiddleware } from "hono/factory";
import { auth } from "../auth.js";

export type AuthVars = { userId: string };

export const requireAuth = createMiddleware<{ Variables: AuthVars }>(
  async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: "Unauthorized" }, 401);
    c.set("userId", session.user.id);
    await next();
  }
);
