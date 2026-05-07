import { Hono } from "hono";
import { supabase } from "../db.js";
import { requireAuth, type AuthVars } from "../middleware/require-auth.js";

const router = new Hono<{ Variables: AuthVars }>();

router.use(requireAuth);

router.get("/", async (c) => {
  const { data, error } = await supabase
    .from("budgets")
    .select("category, limit")
    .eq("userId", c.get("userId"));
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

router.post("/", async (c) => {
  const { category, limit } = await c.req.json();
  const { data, error } = await supabase
    .from("budgets")
    .upsert({ userId: c.get("userId"), category, limit }, { onConflict: "userId,category" })
    .select("category, limit")
    .single();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data, 201);
});

router.delete("/:category", async (c) => {
  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("userId", c.get("userId"))
    .eq("category", decodeURIComponent(c.req.param("category")));
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ success: true });
});

export default router;
