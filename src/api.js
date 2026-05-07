import { createAuthClient } from "better-auth/client";

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

export const api = {
  transactions: {
    list:   ()       => req("/transactions"),
    create: (data)   => req("/transactions", { method: "POST", body: JSON.stringify(data) }),
    delete: (id)     => req(`/transactions/${id}`, { method: "DELETE" }),
  },
  earnings: {
    list:   ()       => req("/earnings"),
    create: (data)   => req("/earnings", { method: "POST", body: JSON.stringify(data) }),
    delete: (id)     => req(`/earnings/${id}`, { method: "DELETE" }),
  },
  budgets: {
    list:   ()       => req("/budgets"),
    upsert: (data)   => req("/budgets", { method: "POST", body: JSON.stringify(data) }),
    delete: (cat)    => req(`/budgets/${encodeURIComponent(cat)}`, { method: "DELETE" }),
  },
  goals: {
    list:   ()       => req("/goals"),
    create: (data)   => req("/goals", { method: "POST", body: JSON.stringify(data) }),
    update: (id, d)  => req(`/goals/${id}`, { method: "PUT", body: JSON.stringify(d) }),
    delete: (id)     => req(`/goals/${id}`, { method: "DELETE" }),
  },
  claude: {
    message: (body) => req("/claude", { method: "POST", body: JSON.stringify(body) }),
  },
};
