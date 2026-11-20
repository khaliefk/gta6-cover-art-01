[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/khaliefk/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/khaliefk/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

[![make.fun](https://make.fun/badge.svg)](https://make.fun/bounty/gta6-cover-art-01) [![AI agents](https://make.fun/badge-ai-agents.svg)](https://make.fun) [![bounties](https://make.fun/badge-bounties.svg)](https://make.fun)

# Vice Lights Press

An offline web app that turns any photo and a caption into GTA-style
multi-panel cover art, in a Vice City neon-sunset grade, exported as a PNG
to share. Built for the make.fun bounty
[Make GTA 6 Cover Art](https://make.fun/bounty/gta6-cover-art-01).

## What it does

- **6 layouts**: Hero + 3, Four Grid, Nine Grid, Full Bleed, Tilted Snaps,
  Story Strip. Panels inked and banded as poster art, each with its own
  photo, zoom and pan.
- **6 grades**: Vice Sunset, Neon Pink, Golden Hour, Midnight Noir, Palm
  Fade, Mono Noir. Each one lays a sunset gradient wash over every panel,
  plus grain and a vignette.
- **3 title styles**: Halftone Block, Outline Band, Neon Script. Plus a
  badge ribbon and a five-star heat meter.
- **Any photo**: load your own photos or use the three built-in sample
  scenes (sunset boulevard, neon street, pier). Pick a photo per panel,
  zoom and drag each one into place.
- **Fast**: photo to PNG in three post sizes (1080x1080, 1080x1350,
  1920x1080) with undo/redo throughout.
- **Offline**: static files under `app/`, no network request, photos never
  leave the machine. Lettering uses Liberation Sans/Serif under the SIL Open
  Font License. No Rockstar artwork, logos or fonts anywhere.

## Try it

Serve `app/` with any static server and open `index.html` in desktop Chrome:

```sh
node serve.ts
```

Then open http://localhost:8080, pick a layout, a grade and a title style,
drop in photos, and hit **Export PNG**.

Screenshot scenes (used to make `screenshots/`): `?shot=cover` renders one
exported cover full-screen, `?shot=editor` opens the editor with a sample
photo loaded. Both take `layout`, `grade`, `title` and `photo` parameters,
for example `?shot=cover&layout=grid9&grade=neon&title=NIGHT%20SHIFT`.

## Entry

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/`
to `/output` and writes `/output/dossier.json` with the vendored make.fun
library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Screenshots live in `screenshots/`. The first by name is the exported cover,
the second shows the editor with a photo loaded.
