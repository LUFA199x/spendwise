import { Hono } from "hono";
import { supabase } from "../db.js";
import { requireAuth, type AuthVars } from "../middleware/require-auth.js";
import { redis } from "../redis.js";

const router = new Hono<{ Variables: AuthVars }>();

router.use(requireAuth);

router.get("/", async (c) => {
  const userId = c.get("userId");
  const key = `transactions:${userId}`;
  const cached = await redis.get(key).catch(() => null);
  if (cached) return c.json(JSON.parse(cached));

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("userId", userId)
    .order("date", { ascending: false });
  if (error) return c.json({ error: error.message }, 500);

  await redis.set(key, JSON.stringify(data), "EX", 60).catch(() => {});
  return c.json(data);
});

router.post("/", async (c) => {
  const body = await c.req.json();
  const userId = c.get("userId");
  const { data, error } = await supabase
    .from("transactions")
    .insert({ ...body, userId })
    .select()
    .single();
  if (error) return c.json({ error: error.message }, 500);
  await redis.del(`transactions:${userId}`).catch(() => {});
  return c.json(data, 201);
});

router.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", c.req.param("id"))
    .eq("userId", userId);
  if (error) return c.json({ error: error.message }, 500);
  await redis.del(`transactions:${userId}`).catch(() => {});
  return c.json({ success: true });
});

export default router;
