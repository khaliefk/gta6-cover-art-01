# Neon Boulevard Press

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/khaliefk/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/khaliefk/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Neon Boulevard Press turns photos and a caption into a multi-panel cover poster. It runs offline in the browser. Your photos never leave your machine.

Pick a layout, pick a grade, type a title. Click a panel, then click a photo to place it there. Drag the photo to move it. Scroll to zoom it. The preview shows the cover at export size. Download gives you a PNG at 1080 by 1080, 1080 by 1350, or 1920 by 1080.

The app ships with 8 layouts, 6 grades, and 3 title styles. It also has undo and redo, shuffle, film grain, a vignette, and a badge ribbon. The postcard layout paints its own sunset sky, sun, skyline, and palms in code.

The three sample photos were made for this app. All art here is original. No studio logos, no official artwork, no borrowed fonts.

## Run it

```sh
node serve.ts
```

Open http://localhost:8080.

Build the entry dossier the grader reads:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Files

- `app/index.html` is the page and the editor controls.
- `app/style.css` is the dark studio interface.
- `app/src/state.js` holds the layouts, the grades, and the cover state.
- `app/src/render.js` draws the cover on canvas: panels, grades, title, grain, vignette.
- `app/src/main.js` wires the controls, the photo tray, and the PNG export.
- `app/samples/` holds the three sample photos.
- `main.ts` copies `app/` and `screenshots/` to the output dir and writes `dossier.json`.
- `serve.ts` serves `app/` on port 8080 for local testing.
- `screenshots/` holds four renders: the finished cover, the editor, a second cover, and a PNG the app exported.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
