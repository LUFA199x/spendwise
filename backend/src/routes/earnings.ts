import { Hono } from "hono";
import { supabase } from "../db.js";
import { requireAuth, type AuthVars } from "../middleware/require-auth.js";

const router = new Hono<{ Variables: AuthVars }>();

router.use(requireAuth);

router.get("/", async (c) => {
  const { data, error } = await supabase
    .from("earnings")
    .select("*")
    .eq("userId", c.get("userId"))
    .order("date", { ascending: false });
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

router.post("/", async (c) => {
  const body = await c.req.json();
  const { data, error } = await supabase
    .from("earnings")
    .insert({ ...body, userId: c.get("userId") })
    .select()
    .single();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data, 201);
});

router.delete("/:id", async (c) => {
  const { error } = await supabase
    .from("earnings")
    .delete()
    .eq("id", c.req.param("id"))
    .eq("userId", c.get("userId"));
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ success: true });
});

export default router;
