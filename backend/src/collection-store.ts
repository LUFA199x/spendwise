import { redis } from "./redis.js";

/** The slice of a Supabase client this module needs. */
export type CollectionClient = { from(table: string): any };

export type CollectionSpec = {
  table: string;
  select?: string;
  orderBy?: { column: string; ascending: boolean };
};

type Failure = { message: string } | null;

const CACHE_TTL = 60; // seconds

/**
 * A user-owned collection. Every read and write is scoped to a userId, and
 * reads go through a Redis cache keyed `{table}:{userId}` that writes bust.
 *
 * The client is a parameter so tests can pass an in-memory adapter: that
 * second adapter is what makes the seam real rather than hypothetical.
 */
export function collectionStore(client: CollectionClient, spec: CollectionSpec) {
  const { table, select = "*", orderBy } = spec;

  const keyFor = (userId: string) => `${table}:${userId}`;
  const bust = async (userId: string) => {
    await redis?.del(keyFor(userId)).catch(() => {});
  };

  return {
    table,
    keyFor,

    async list(userId: string): Promise<{ data: unknown; error: Failure }> {
      const key = keyFor(userId);
      const cached = (await redis?.get<unknown[]>(key).catch(() => null)) ?? null;
      if (cached) return { data: cached, error: null };

      let query = client.from(table).select(select).eq("userId", userId);
      if (orderBy) query = query.order(orderBy.column, { ascending: orderBy.ascending });
      const { data, error } = await query;
      if (error) return { data: null, error };

      await redis?.set(key, data, { ex: CACHE_TTL }).catch(() => {});
      return { data, error: null };
    },

    async create(userId: string, body: Record<string, unknown>): Promise<{ data: unknown; error: Failure }> {
      const { data, error } = await client
        .from(table)
        .insert({ ...body, userId })
        .select(select)
        .single();
      if (error) return { data: null, error };
      await bust(userId);
      return { data, error: null };
    },

    async update(userId: string, id: string, body: Record<string, unknown>): Promise<{ data: unknown; error: Failure }> {
      const { data, error } = await client
        .from(table)
        .update(body)
        .eq("id", id)
        .eq("userId", userId)
        .select(select)
        .single();
      if (error) return { data: null, error };
      await bust(userId);
      return { data, error: null };
    },

    async remove(userId: string, id: string): Promise<{ error: Failure }> {
      const { error } = await client.from(table).delete().eq("id", id).eq("userId", userId);
      if (error) return { error };
      await bust(userId);
      return { error: null };
    },
  };
}
