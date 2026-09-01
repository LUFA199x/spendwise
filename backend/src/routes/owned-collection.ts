import { Hono } from "hono";
import { requireAuth, type AuthVars } from "../middleware/require-auth.js";
import {
  collectionStore,
  type CollectionClient,
  type CollectionSpec,
} from "../collection-store.js";

export type OwnedCollectionSpec = CollectionSpec & { update?: boolean };

/**
 * HTTP adapter over a user-owned collection: maps routes onto the store and
 * store failures onto 500s. All the behaviour lives in `collectionStore`.
 */
export function ownedCollection(client: CollectionClient, spec: OwnedCollectionSpec) {
  const store = collectionStore(client, spec);
  const router = new Hono<{ Variables: AuthVars }>();

  router.use(requireAuth);

  router.get("/", async (c) => {
    const { data, error } = await store.list(c.get("userId"));
    if (error) return c.json({ error: error.message }, 500);
    return c.json(data);
  });

  router.post("/", async (c) => {
    const body = await c.req.json();
    const { data, error } = await store.create(c.get("userId"), body);
    if (error) return c.json({ error: error.message }, 500);
    return c.json(data, 201);
  });

  if (spec.update) {
    router.put("/:id", async (c) => {
      const body = await c.req.json();
      const { data, error } = await store.update(c.get("userId"), c.req.param("id"), body);
      if (error) return c.json({ error: error.message }, 500);
      return c.json(data);
    });
  }

  router.delete("/:id", async (c) => {
    const { error } = await store.remove(c.get("userId"), c.req.param("id"));
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ success: true });
  });

  return router;
}
