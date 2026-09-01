import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveToken, cacheKey, sessionCache } from "../src/session-cache.js";

const h = (init: Record<string, string>) => new Headers(init);

test("derives the token from an Authorization bearer header", () => {
  assert.equal(deriveToken(h({ authorization: "Bearer abc123" })), "abc123");
});

test("derives the token from the better-auth cookie among several cookies", () => {
  const headers = h({
    cookie: "theme=dark; better-auth.session_token=tok987; other=1",
  });
  assert.equal(deriveToken(headers), "tok987");
});

test("prefers the Authorization header over the cookie", () => {
  const headers = h({
    authorization: "Bearer fromHeader",
    cookie: "better-auth.session_token=fromCookie",
  });
  assert.equal(deriveToken(headers), "fromHeader");
});

test("falls back to the whole cookie header when no named cookie is present", () => {
  assert.equal(deriveToken(h({ cookie: "opaque-value" })), "opaque-value");
});

test("returns null when no token is present, so anonymous requests never share a key", () => {
  assert.equal(deriveToken(h({})), null);
  assert.equal(cacheKey(h({})), null);
});

test("the auth path and the signout path derive the same key", () => {
  // The regression this refactor exists to prevent: two call sites that
  // parsed headers independently and could drift apart.
  const headers = h({ cookie: "better-auth.session_token=shared-token" });
  assert.equal(cacheKey(headers), "session:shared-token");
  assert.equal(cacheKey(headers), cacheKey(new Headers(headers)));
});

test("degrades to a miss when Redis is absent", async () => {
  // No UPSTASH_* env vars in test, so redis is null throughout.
  const headers = h({ cookie: "better-auth.session_token=t" });
  assert.equal(await sessionCache.read(headers), null);
  await sessionCache.write(headers, "user-1"); // must not throw
  await sessionCache.invalidate(headers); // must not throw
});
