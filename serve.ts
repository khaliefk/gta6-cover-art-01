// Neon Boulevard Press: tiny static server for local testing only.
// Serves app/ at http://localhost:8080. Run: node serve.ts

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = join(fileURLToPath(new URL(".", import.meta.url)), "app");
const port = Number(process.env.PORT || 8080);

function mimeFor(file) {
  switch (extname(file)) {
    case ".html": return "text/html; charset=utf-8";
    case ".css": return "text/css; charset=utf-8";
    case ".js":
    case ".mjs": return "text/javascript; charset=utf-8";
    case ".jpg":
    case ".jpeg": return "image/jpeg";
    case ".png": return "image/png";
    case ".json": return "application/json";
    default: return "application/octet-stream";
  }
}

const server = createServer(async (req, res) => {
  const raw = req.url || "/";
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(raw, "http://localhost").pathname);
  } catch {
    res.writeHead(400);
    res.end("bad request");
    return;
  }
  const file = join(appRoot, pathname === "/" ? "index.html" : pathname);
  if (!file.startsWith(appRoot)) {
    res.writeHead(403);
    res.end("no");
    return;
  }
  let body;
  try {
    body = await readFile(file);
  } catch {
    res.writeHead(404);
    res.end("not found");
    return;
  }
  res.writeHead(200, { "content-type": mimeFor(file) });
  res.end(body);
});

server.listen(port, () => console.log(`Neon Boulevard Press at http://localhost:${port}`));
