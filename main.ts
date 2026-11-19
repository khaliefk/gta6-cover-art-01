// Neon Boulevard Press: entrypoint. The grader runs this file with Node 22.
// It hands in the app as static files plus the screenshots, and writes the
// dossier the kit's library builds from them.
//
// Run locally: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-app.ts";

const root = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";

const appDir = join(root, "app");
const shotsDir = join(root, "screenshots");

if (!existsSync(appDir)) throw new Error(`main.ts: no app/ directory beside ${import.meta.url}`);
if (!existsSync(join(appDir, "index.html"))) throw new Error("main.ts: app/index.html is missing");
if (!existsSync(shotsDir)) throw new Error("main.ts: no screenshots/ directory beside main.ts");

mkdirSync(join(outDir, "app"), { recursive: true });
mkdirSync(join(outDir, "screenshots"), { recursive: true });

cpSync(appDir, join(outDir, "app"), { recursive: true });
cpSync(shotsDir, join(outDir, "screenshots"), { recursive: true });

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});

writeFileSync(join(outDir, "dossier.json"), dossier);
console.log(`main.ts: wrote ${outDir}/dossier.json (${dossier.length} bytes)`);
