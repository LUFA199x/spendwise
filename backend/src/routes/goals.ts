import { Hono } from "hono";
import { supabase } from "../db.js";
import { requireAuth, type AuthVars } from "../middleware/require-auth.js";
import { redis } from "../redis.js";

const router = new Hono<{ Variables: AuthVars }>();

router.use(requireAuth);

router.get("/", async (c) => {
  const userId = c.get("userId");
  const key = `goals:${userId}`;
  const cached = await redis?.get<any[]>(key).catch(() => null) ?? null;
  if (cached) return c.json(cached);

  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("userId", userId)
    .order("createdAt", { ascending: true });
  if (error) return c.json({ error: error.message }, 500);

  await redis?.set(key, data, { ex: 60 }).catch(() => {});
  return c.json(data);
});

router.post("/", async (c) => {
  const body = await c.req.json();
  const userId = c.get("userId");
  const { data, error } = await supabase
    .from("goals")
    .insert({ ...body, userId })
    .select()
    .single();
  if (error) return c.json({ error: error.message }, 500);
  await redis?.del(`goals:${userId}`).catch(() => {});
  return c.json(data, 201);
});

router.put("/:id", async (c) => {
  const body = await c.req.json();
  const userId = c.get("userId");
  const { data, error } = await supabase
    .from("goals")
    .update(body)
    .eq("id", c.req.param("id"))
    .eq("userId", userId)
    .select()
    .single();
  if (error) return c.json({ error: error.message }, 500);
  await redis?.del(`goals:${userId}`).catch(() => {});
  return c.json(data);
});

router.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const { error } = await supabase
    .from("goals")
    .delete()
    .eq("id", c.req.param("id"))
    .eq("userId", userId);
  if (error) return c.json({ error: error.message }, 500);
  await redis?.del(`goals:${userId}`).catch(() => {});
  return c.json({ success: true });
});

export default router;
