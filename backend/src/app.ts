import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./auth.js";
import { redis } from "./redis.js";
import transactionsRouter from "./routes/transactions.js";
import earningsRouter from "./routes/earnings.js";
import budgetsRouter from "./routes/budgets.js";
import goalsRouter from "./routes/goals.js";
import claudeRouter from "./routes/claude.js";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: (origin) => {
      const allowed = [
        process.env.FRONTEND_URL ?? "http://localhost:5173",
        "http://localhost:5173",
      ];
      return allowed.includes(origin) ? origin : allowed[0];
    },
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.on(["GET", "POST"], "/api/auth/**", (c) => auth.handler(c.req.raw));

app.route("/api/transactions", transactionsRouter);
app.route("/api/earnings", earningsRouter);
app.route("/api/budgets", budgetsRouter);
app.route("/api/goals", goalsRouter);
app.route("/api/claude", claudeRouter);

app.get("/health", (c) => c.json({ ok: true }));

// Invalidate Redis session cache on signout
app.delete("/api/auth/cache", async (c) => {
  const authHeader = c.req.header("Authorization")?.replace("Bearer ", "");
  const cookieHeader = c.req.raw.headers.get("cookie") ?? "";
  const token =
    authHeader ??
    cookieHeader.split(";").map(s => s.trim()).find(s => s.startsWith("better-auth.session_token="))?.split("=")[1] ??
    cookieHeader;
  if (token) await redis?.del(`session:${token}`).catch(() => {});
  return c.json({ ok: true });
});

export default app;
