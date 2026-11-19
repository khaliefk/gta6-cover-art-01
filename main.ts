// Neon Boulevard Press: the hand-in.
//
// Copies app/ and screenshots/ into the output dir and writes the
// dossier the grader reads, using the kit's vendored library.
// The grader runs this with Node and sets MAKEFUN_OUTPUT_DIR;
// outside its container the same variable points at a local dir:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-app.ts";

const here = fileURLToPath(new URL(".", import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

for (const [path, what] of [
  [join(here, "app"), "app/"],
  [join(here, "app", "index.html"), "app/index.html"],
  [join(here, "screenshots"), "screenshots/"],
]) {
  if (!existsSync(path)) throw new Error(`main.ts: ${what} is missing`);
}

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
console.log(`main.ts: dossier.json written to ${out} (${dossier.length} bytes)`);
