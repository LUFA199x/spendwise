import { test } from "node:test";
import assert from "node:assert/strict";
import { collectionStore, type CollectionClient } from "../src/collection-store.js";

type Call = {
  table: string;
  op: string;
  payload?: unknown;
  filters: Record<string, unknown>;
  order?: { column: string; ascending: boolean };
};

/** In-memory adapter: the second adapter that makes the seam real. */
function fakeClient(result: { data?: unknown; error?: { message: string } } = {}) {
  const calls: Call[] = [];

  function chain(table: string, op: string, payload?: unknown) {
    const call: Call = { table, op, payload, filters: {} };
    calls.push(call);
    const self: any = {
      select: () => self,
      single: () => self,
      eq(column: string, value: unknown) {
        call.filters[column] = value;
        return self;
      },
      order(column: string, opts: { ascending: boolean }) {
        call.order = { column, ascending: opts.ascending };
        return self;
      },
      then(resolve: (v: unknown) => void) {
        resolve(
          result.error
            ? { data: null, error: result.error }
            : { data: result.data ?? [], error: null }
        );
      },
    };
    return self;
  }

  const client: CollectionClient & { calls: Call[] } = {
    calls,
    from: (table: string) => ({
      select: () => chain(table, "select"),
      insert: (row: unknown) => chain(table, "insert", row),
      update: (row: unknown) => chain(table, "update", row),
      delete: () => chain(table, "delete"),
    }),
  };
  return client;
}

const spec = {
  table: "transactions",
  orderBy: { column: "date", ascending: false },
};

test("list scopes the query to the user", async () => {
  const client = fakeClient({ data: [{ id: "t1" }] });
  const store = collectionStore(client, spec);

  const { data, error } = await store.list("user-1");

  assert.equal(error, null);
  assert.deepEqual(data, [{ id: "t1" }]);
  assert.equal(client.calls[0].table, "transactions");
  assert.equal(client.calls[0].filters.userId, "user-1");
});

test("list applies the ordering from the spec", async () => {
  const client = fakeClient();
  await collectionStore(client, spec).list("user-1");
  assert.deepEqual(client.calls[0].order, { column: "date", ascending: false });
});

test("create stamps the userId onto the inserted row", async () => {
  const client = fakeClient({ data: { id: "t9" } });
  await collectionStore(client, spec).create("user-1", { amount: 500 });

  assert.equal(client.calls[0].op, "insert");
  assert.deepEqual(client.calls[0].payload, { amount: 500, userId: "user-1" });
});

test("create cannot be tricked into writing to another user", async () => {
  const client = fakeClient({ data: {} });
  await collectionStore(client, spec).create("user-1", { userId: "attacker" });

  // userId is applied after the body spread, so it always wins.
  assert.deepEqual(client.calls[0].payload, { userId: "user-1" });
});

test("update scopes by both id and userId", async () => {
  const client = fakeClient({ data: {} });
  await collectionStore(client, spec).update("user-1", "row-7", { name: "x" });

  assert.equal(client.calls[0].op, "update");
  assert.deepEqual(client.calls[0].filters, { id: "row-7", userId: "user-1" });
});

test("remove scopes by both id and userId", async () => {
  const client = fakeClient();
  await collectionStore(client, spec).remove("user-1", "row-7");

  assert.equal(client.calls[0].op, "delete");
  assert.deepEqual(client.calls[0].filters, { id: "row-7", userId: "user-1" });
});

test("store failures propagate instead of being swallowed", async () => {
  const client = fakeClient({ error: { message: "boom" } });
  const { data, error } = await collectionStore(client, spec).list("user-1");

  assert.equal(data, null);
  assert.equal(error?.message, "boom");
});

test("the cache key is derived from table and user", () => {
  const store = collectionStore(fakeClient(), spec);
  assert.equal(store.keyFor("user-1"), "transactions:user-1");
});
