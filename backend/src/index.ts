import { serve } from "@hono/node-server";
import app from "./app.js";

const port = parseInt(process.env.PORT ?? "3000");
serve({ fetch: app.fetch, port }, () =>
  console.log(`SpendWise backend → http://localhost:${port}`)
);
