// Neon Boulevard Press: the hand-in.
//
// Copies app/ and screenshots/ into the output dir and writes the
// dossier the grader reads, using the kit's vendored library.
// The grader runs this with Node and sets MAKEFUN_OUTPUT_DIR; outside
// its container the same variable points at a local dir:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-app.ts";

const here = fileURLToPath(new URL(".", import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

for (const needed of ["app", "app/index.html", "screenshots"]) {
  if (!existsSync(join(here, needed))) {
    throw new Error(`main.ts: ${needed} is missing, nothing to hand in`);
  }
}

mkdirSync(join(out, "app"), { recursive: true });
mkdirSync(join(out, "screenshots"), { recursive: true });
cpSync(join(here, "app"), join(out, "app"), { recursive: true });
cpSync(join(here, "screenshots"), join(out, "screenshots"), { recursive: true });

// Caps from the scorer's gate: at most 4 screenshots, each under
// 256 KiB; app/ under 993 files and 48 MiB in total.
const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});

writeFileSync(join(out, "dossier.json"), dossier);
console.log(`main.ts: dossier.json written to ${out} (${dossier.length} bytes)`);
