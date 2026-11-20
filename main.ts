// Vice Lights Press: the entry program (Node 22, standard library only).
// It hands in the app beside this file: app/ (the offline cover maker) and
// screenshots/ (three renders of it), and writes /output/dossier.json with
// the vendored make.fun library, which the scorer re-runs byte for byte.
//
// Run it outside the grader's container with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function handInDir(name) {
  const from = join(repoDir, name);
  const to = join(outputDir, name);
  mkdirSync(to, { recursive: true });
  if (existsSync(from)) cpSync(from, to, { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
handInDir('app');
handInDir('screenshots');

// The gate's caps (reference/gate.json): text_max_bytes is the only one that
// shapes the dossier's bytes; the rest refuse an entry the scorer would
// refuse (more than 4 screenshots or one over 256 KiB; more than 993 entries
// in app/ or 48 MiB of app files, or a path under app/ over 1000 bytes).
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
