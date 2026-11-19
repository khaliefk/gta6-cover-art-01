// Neon Boulevard Press: entrypoint. The grader runs this file with Node.
// It hands in the app as static files plus the screenshots, and writes the
// dossier the kit's library builds from them.
//
// Run locally: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-app.ts";

const here = fileURLToPath(new URL(".", import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

function need(path, what) {
  if (!existsSync(path)) throw new Error(`main.ts: ${what} is missing (${path})`);
}

need(join(here, "app"), "app/");
need(join(here, "app", "index.html"), "app/index.html");
need(join(here, "screenshots"), "screenshots/");

mkdirSync(join(out, "app"), { recursive: true });
mkdirSync(join(out, "screenshots"), { recursive: true });
cpSync(join(here, "app"), join(out, "app"), { recursive: true });
cpSync(join(here, "screenshots"), join(out, "screenshots"), { recursive: true });

const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});

writeFileSync(join(out, "dossier.json"), dossier);
console.log(`main.ts: wrote ${out}/dossier.json (${dossier.length} bytes)`);
