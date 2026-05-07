import { Hono } from "hono";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth, type AuthVars } from "../middleware/require-auth.js";

const router = new Hono<{ Variables: AuthVars }>();

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

router.use(requireAuth);

router.post("/", async (c) => {
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
