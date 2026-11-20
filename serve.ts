// A tiny static server for trying the app locally (Node 22, standard
// library only): `node serve.ts` serves app/ on http://localhost:8080.
// It sends the MIME types an offline web app needs, refuses any path
// outside app/, and does nothing else: a development convenience, not a
// web server for the internet.

import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(fileURLToPath(new URL('./app', import.meta.url)));
const portArg = process.argv.indexOf('--port');
const wanted = portArg === -1 ? 8080 : Number(process.argv[portArg + 1]);
const port = Number.isInteger(wanted) && wanted > 0 && wanted < 65536 ? wanted : 8080;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
};

const server = createServer((req, res) => {
  const raw = decodeURIComponent((req.url || '/').split('?')[0]);
  const path = normalize(join(appRoot, raw === '/' ? 'index.html' : raw));
  if (!path.startsWith(appRoot + sep) && path !== appRoot) {
    res.writeHead(403);
    res.end('outside app/');
    return;
  }
  let stat;
  try {
    stat = statSync(path);
  } catch {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  if (!stat.isFile()) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' });
  createReadStream(path).pipe(res);
});

server.listen(port, () => {
  console.log(`Vice Lights Press at http://localhost:${port}/`);
});
