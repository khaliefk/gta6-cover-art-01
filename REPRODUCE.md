# REPRODUCE.md — how the art was made

## The app

The cover art is drawn live by `app/src/cover.js` on a 2D canvas, from
the state in `app/src/main.js`. No Rockstar artwork, logo or font is
used anywhere. Reproduce it by opening the app (`node serve.ts`, then
http://localhost:8080), loading photos, and pressing Export PNG.

- Layouts: `layoutPanels()` in `cover.js` computes every panel as a
  fraction of the canvas, so the same state renders at preview size and
  at full export size.
- Grades: each grade is a two-stop gradient wash (top and bottom colour)
  drawn over the panels, plus a radial vignette.
- Lettering: the title is set in Anton (vendored under the SIL Open
  Font License), filled with a white-to-gold-to-grade vertical gradient
  and a dark outline; the subtitle is Pacifico script in the grade glow
  colour; the badge is a rotated ribbon; the heat meter is five stars.
- Texture: deterministic film grain (seeded) and halftone dot corners
  on the title band.

## Sample photos

The three photos under `app/samples/` were made with an image model on
19 Nov 2026, from these prompts (no real people, no text, no logos):

- `boulevard.jpg`: a confident woman in her late 20s with big
  sunglasses, gold hoop earrings and an unbuttoned white linen shirt
  over a black t-shirt, leaning on the open door of a vintage red
  convertible on a palm-lined beach boulevard at golden hour.
- `rooftop.jpg`: a man in his 30s with a short beard, open floral shirt
  and a gold chain, standing on a hotel rooftop at dusk with a hazy city
  skyline and palm trees behind him.
- `neon.jpg`: two friends in their 20s laughing on a neon-lit night
  street outside a diner, wet pavement reflecting pink and teal neon.

## Fonts

Anton and Pacifico, downloaded from the google/fonts repository
(`ofl/anton/Anton-Regular.ttf`, `ofl/pacifico/Pacifico-Regular.ttf`),
both under the SIL Open Font License; the licence text is
`app/fonts/OFL.txt`.

## Screenshots

The four screenshots in `screenshots/` were taken from the app itself
in headless Chrome, using the fixed `?shot=` scenes in `shots.json`:

1. `1-cover.jpg` — wide 1920 x 1080 cover, Vice Grid, Vice Sunset,
   title "Neon Shore", scaled to 1280 x 720.
2. `2-editor.jpg` — the editor with the sample photos loaded, same
   cover state, 1280 x 720.
3. `3-cover.jpg` — square 1080 x 1080 cover, Hero + Three, Neon Night,
   title "Pier Pressure", scaled to 1024 x 1024.
4. `4-cover.jpg` — portrait 1080 x 1350 cover, Tilted Snaps, Palm Gold,
   title "Sunset Heist", scaled to 1024 x 1280.

Each is the app's own drawing, scaled down only; nothing was edited,
composited or borrowed.
