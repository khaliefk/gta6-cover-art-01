# Neon Boulevard Press

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/khaliefk/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/khaliefk/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

A cover poster maker that lives in one web page. Feed it photos and a few words, and it lays them out as a multi-panel poster in the style of a big open-world game cover. No account, no upload, no server. Open the page, make the cover, download the PNG.

## How a cover comes together

Load the sample photos or drop in your own. Choose one of 8 panel layouts and one of 6 color grades. Type a title, a subtitle, and a badge. Click a panel to pick it, then click a photo to fill it. Drag inside a panel to slide the photo, scroll to zoom. Undo and redo cover every change, and Shuffle rolls a fresh combination when you want a surprise.

The preview shows the cover at full export size, so nothing about the download is a guess. Export sizes are 1080 by 1080, 1080 by 1350, and 1920 by 1080. The postcard layout is the odd one out: it paints a sunset sky, a sun, a skyline, and palms in code, then leans three photo cards against it.

Everything on the page is original art. The sample photos come from a small drawing script in this repo, not from a game or a stock library. There are no studio logos, no official artwork, and no borrowed fonts.

## Run it

```sh
node serve.ts
```

Open http://localhost:8080.

Build the entry dossier the grader reads:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## What lives where

- `app/index.html` is the page: photo tray, cover preview, and controls.
- `app/style.css` is the dark studio interface.
- `app/src/catalog.js` lists the 8 layouts, the 6 grades, the 3 title styles, and the starting cover.
- `app/src/render.js` draws the cover on canvas: panels, grades, title, grain, vignette.
- `app/src/app.js` wires the controls, the photo tray, history, and the PNG export.
- `app/samples/` holds the three sample photos.
- `tools/make-samples.py` draws those sample photos. Run it again any time to redraw them.
- `tools/verify.mjs` drives headless Chromium over CDP. It takes the four screenshots, watches the console, and checks a real PNG export.
- `main.ts` copies `app/` and `screenshots/` to the output dir and writes `dossier.json`.
- `serve.ts` serves `app/` on port 8080 for local testing.
- `screenshots/` holds four renders: the finished cover, the editor, a second cover, and a PNG the app exported.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
