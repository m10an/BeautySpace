import { createServer } from "node:http";
import { pathToFileURL } from "node:url";
import { createHandler } from "./handler.js";
export function createNodeServer(options) {
  const handle = createHandler(options);
  return createServer(async (req, res) => {
    const abort = new AbortController();
    req.on("aborted", () => abort.abort());
    res.on("close", () => {
      if (!res.writableEnded) abort.abort();
    });
    let size = 0;
    const chunks = [];
    try {
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 32768) {
          res.writeHead(413, {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          });
          res.end('{"error":"payload_too_large"}');
          return;
        }
        chunks.push(chunk);
      }
      const method = req.method || "GET";
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers))
        if (value !== undefined)
          headers.set(key, Array.isArray(value) ? value.join(",") : value);
      const request = new Request(new URL(req.url, "http://localhost"), {
        method,
        headers,
        signal: abort.signal,
        ...(!["GET", "HEAD"].includes(method)
          ? { body: Buffer.concat(chunks) }
          : {}),
      });
      const response = await handle(request, {
        ip: req.socket.remoteAddress || "unknown",
      });
      if (res.destroyed) return;
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(await response.text());
    } catch {
      if (res.destroyed) return;
      if (!res.headersSent)
        res.writeHead(500, {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        });
      res.end('{"error":"server_error"}');
    }
  });
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  createNodeServer().listen(
    Number(process.env.AI_PORT) || 8787,
    process.env.AI_HOST || "127.0.0.1",
    () =>
      console.log(
        "Beauty AI backend started. Request contents and credentials are not logged.",
      ),
  );
}
