import { Hono } from "hono";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth, type AuthVars } from "../middleware/require-auth.js";
import { redis } from "../redis.js";

const router = new Hono<{ Variables: AuthVars }>();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const RATE_LIMIT = 10; // requests per window
const RATE_WINDOW = 60; // seconds

router.use(requireAuth);

router.post("/", async (c) => {
  const userId = c.get("userId");
  const ratKey = `claude:rate:${userId}`;

  const count = await redis?.incr(ratKey).catch(() => null) ?? null;
  if (count === 1) await redis?.expire(ratKey, RATE_WINDOW).catch(() => {});
  if (count !== null && count > RATE_LIMIT) {
    const ttl = await redis?.ttl(ratKey).catch(() => RATE_WINDOW) ?? RATE_WINDOW;
    return c.json({ error: "Rate limit exceeded. Try again shortly." }, 429, {
      "Retry-After": String(ttl),
    });
  }

  const body = await c.req.json();
  try {
    const message = await anthropic.messages.create({
      model:      body.model      ?? "claude-sonnet-4-6",
      max_tokens: body.max_tokens ?? 1024,
      system:     body.system,
      messages:   body.messages,
    });
    return c.json(message);
  } catch (e: any) {
    return c.json({ error: e.message ?? "Claude request failed" }, 502);
  }
});

export default router;
