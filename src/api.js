import { createAuthClient } from "better-auth/client";
import { cache } from "./cache.js";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export const authClient = createAuthClient({ baseURL: BASE });

const req = (path, opts = {}) =>
  fetch(`${BASE}/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...opts.headers },
    ...opts,
  }).then(async (r) => {
    const json = await r.json();
    if (!r.ok) throw new Error(json.error ?? "Request failed");
    return json;
  });

const cached = (key, fn) => async () => {
  const hit = cache.get(key);
  if (hit) return hit;
  const data = await fn();
  cache.set(key, data);
  return data;
};

const bust = (key, fn) => async (...args) => {
  const result = await fn(...args);
  cache.del(key);
  return result;
};

export const api = {
  transactions: {
    list:   cached("transactions", () => req("/transactions")),
    create: bust("transactions", (data) => req("/transactions", { method: "POST", body: JSON.stringify(data) })),
    delete: bust("transactions", (id)   => req(`/transactions/${id}`, { method: "DELETE" })),
  },
  earnings: {
    list:   cached("earnings", () => req("/earnings")),
    create: bust("earnings", (data) => req("/earnings", { method: "POST", body: JSON.stringify(data) })),
    delete: bust("earnings", (id)   => req(`/earnings/${id}`, { method: "DELETE" })),
  },
  budgets: {
    list:   cached("budgets", () => req("/budgets")),
    upsert: bust("budgets", (data) => req("/budgets", { method: "POST", body: JSON.stringify(data) })),
    delete: bust("budgets", (cat)  => req(`/budgets/${encodeURIComponent(cat)}`, { method: "DELETE" })),
  },
  goals: {
    list:   cached("goals", () => req("/goals")),
    create: bust("goals", (data)    => req("/goals", { method: "POST", body: JSON.stringify(data) })),
    update: bust("goals", (id, d)   => req(`/goals/${id}`, { method: "PUT", body: JSON.stringify(d) })),
    delete: bust("goals", (id)      => req(`/goals/${id}`, { method: "DELETE" })),
  },
  claude: {
    message: (body) => req("/claude", { method: "POST", body: JSON.stringify(body) }),
  },
};
