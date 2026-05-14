import type { IncomingMessage, ServerResponse } from "http";
import app from "../src/app.js";

export const config = { runtime: "nodejs" };

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // Fully buffer the request body before handing to Hono
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const rawBody = Buffer.concat(chunks);

  // Build URL — Vercel is always HTTPS
  const host = req.headers.host || "localhost";
  const url = new URL(`https://${host}${req.url || "/"}`);

  // Build Headers from raw headers (preserves duplicates, skips pseudo-headers)
  const headers = new Headers();
  const rawHeaders = req.rawHeaders;
  for (let i = 0; i < rawHeaders.length; i += 2) {
    if (rawHeaders[i].charCodeAt(0) !== 58 /* ":" */) {
      headers.append(rawHeaders[i], rawHeaders[i + 1]);
    }
  }

  const method = req.method ?? "GET";
  const webReq = new Request(url.toString(), {
    method,
    headers,
    body: method === "GET" || method === "HEAD" ? undefined : rawBody,
  });

  try {
    const webRes = await app.fetch(webReq);

    // Collect headers — handle multiple Set-Cookie correctly
    const outHeaders: Record<string, string | string[]> = {};
    const cookies: string[] = [];
    webRes.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        cookies.push(value);
      } else {
        outHeaders[key] = value;
      }
    });
    if (cookies.length > 0) outHeaders["set-cookie"] = cookies;

    res.writeHead(webRes.status, outHeaders);
    res.end(Buffer.from(await webRes.arrayBuffer()));
  } catch (e) {
    console.error("Handler error:", e);
    res.writeHead(500);
    res.end("Internal Server Error");
  }
}
