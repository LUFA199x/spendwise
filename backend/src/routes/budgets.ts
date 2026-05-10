import { Hono } from "hono";
import { supabase } from "../db.js";
import { requireAuth, type AuthVars } from "../middleware/require-auth.js";
import { redis } from "../redis.js";

const router = new Hono<{ Variables: AuthVars }>();

router.use(requireAuth);

router.get("/", async (c) => {
  const userId = c.get("userId");
  const key = `budgets:${userId}`;
  const cached = await redis?.get<any[]>(key).catch(() => null) ?? null;
  if (cached) return c.json(cached);

  const { data, error } = await supabase
    .from("budgets")
    .select("category, limit")
    .eq("userId", userId);
  if (error) return c.json({ error: error.message }, 500);

  await redis?.set(key, data, { ex: 60 }).catch(() => {});
  return c.json(data);
});

router.post("/", async (c) => {
  const { category, limit } = await c.req.json();
  const userId = c.get("userId");
  const { data, error } = await supabase
    .from("budgets")
    .upsert({ userId, category, limit }, { onConflict: "userId,category" })
    .select("category, limit")
    .single();
  if (error) return c.json({ error: error.message }, 500);
  await redis?.del(`budgets:${userId}`).catch(() => {});
  return c.json(data, 201);
});

router.delete("/:category", async (c) => {
  const userId = c.get("userId");
  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("userId", userId)
    .eq("category", decodeURIComponent(c.req.param("category")));
  if (error) return c.json({ error: error.message }, 500);
  await redis?.del(`budgets:${userId}`).catch(() => {});
  return c.json({ success: true });
});

export default router;
