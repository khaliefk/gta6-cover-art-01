# Neon Coast Cover Studio

A free offline web app that turns your photos and a caption into a
multi-panel poster cover in the style of a Vice City sunset, exported as
a PNG to share. Nothing leaves your machine: photos are read locally and
never uploaded.

## What it does

- Six layouts: Vice Grid (nine panels), Hero + Three, Tilted Snaps,
  Split Duo, Sunset Strip, Story Stack.
- Six colour grades: Vice Sunset, Neon Night, Palm Gold, Teal Noir,
  Candy Pink, Ink Mono.
- Any photo: add your own photos, click a panel to select it, then crop
  with zoom and pan sliders or by dragging the cover itself. Fill every
  panel with one photo, or shuffle photos across panels.
- Caption: title in Anton, subtitle in Pacifico script, a badge ribbon
  and a five-star heat meter.
- Finish: white panel frames, film grain and halftone corners, undo and
  redo, export in 1080 x 1080, 1080 x 1350 or 1920 x 1080.

## Run it

```
node serve.ts
```

Open http://localhost:8080 in desktop Chrome. No build step, no network
request: every file the page loads lives under `app/`.

## Files

- `app/index.html`, `app/style.css` — the editor page.
- `app/src/cover.js` — the cover engine: layouts, grades, lettering.
- `app/src/main.js` — editor wiring: undo/redo, export, panel framing.
- `app/src/shots.js` — fixed `?shot=` scenes for screenshots.
- `app/fonts/` — Anton and Pacifico under the SIL Open Font License.
- `app/samples/` — three sample photos made with an image model.
- `main.ts` — hands the app in (copies `app/` and `screenshots/`,
  writes `dossier.json`).
- `REPRODUCE.md` — how the art and the screenshots were made.

## Originality

All art, lettering and code are original. No Rockstar Games logo,
wordmark, artwork, character or font is used anywhere. The sample photos
were made with an image model from the prompts in `REPRODUCE.md`.
Fonts are Anton and Pacifico, both SIL Open Font License (see
`app/fonts/OFL.txt`).

## License

MIT. See `LICENSE`.
