// Neon Boulevard Press: tiny static server for local testing only.
// Serves app/ at http://localhost:8080. Run: node serve.ts

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "app");
const port = Number(process.env.PORT || 8080);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".json": "application/json",
};

const server = createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url || "/", "http://localhost").pathname);
    const file = join(root, path === "/" ? "index.html" : path);
    if (!file.startsWith(root)) {
      res.writeHead(403);
      res.end("no");
      return;
    }
    const body = await readFile(file);
    res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
});

server.listen(port, () => console.log(`Neon Boulevard Press at http://localhost:${port}`));
