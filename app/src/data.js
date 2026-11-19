// Neon Boulevard Press: the catalog and the cover state.
//
// A layout is a list of panel boxes in unit coordinates, 0 to 1 across the
// cover, plus a title box. A panel holds one photo. Nothing here names
// pixels, so the same layout works at every export size.

export const SAMPLES = [
  { id: "strip", name: "Sunset strip", src: "samples/strip.jpg" },
  { id: "alley", name: "Neon alley", src: "samples/alley.jpg" },
  { id: "drive", name: "Ocean drive", src: "samples/drive.jpg" },
];

export const SIZES = [
  { id: "1080x1080", name: "Square 1080 x 1080", w: 1080, h: 1080 },
  { id: "1080x1350", name: "Portrait 1080 x 1350", w: 1080, h: 1350 },
  { id: "1920x1080", name: "Wide 1920 x 1080", w: 1920, h: 1080 },
];

export const TITLE_STYLES = [
  { id: "sunset", name: "Sunset letters" },
  { id: "paper", name: "Plain white" },
  { id: "hollow", name: "Hollow outline" },
];

// A layout's bg decides what shows behind the panels. "photos" means the
// panels cover the whole cover. "sky" means a painted sunset sky shows
// between the cards. The title box has a mode: "cell" paints a card,
// "band" paints a dark strip, "scrim" fades a dark gradient up from the
// bottom, "sky" draws the words straight on the painted sky.
export const LAYOUTS = [
  {
    id: "grid9",
    name: "Nine grid",
    bg: "photos",
    panels: [
      { x: 0, y: 0, w: 0.32, h: 0.32 },
      { x: 0.34, y: 0, w: 0.32, h: 0.32 },
      { x: 0.68, y: 0, w: 0.32, h: 0.32 },
      { x: 0, y: 0.34, w: 0.32, h: 0.32 },
      { x: 0.68, y: 0.34, w: 0.32, h: 0.32 },
      { x: 0, y: 0.68, w: 0.32, h: 0.32 },
      { x: 0.34, y: 0.68, w: 0.32, h: 0.32 },
      { x: 0.68, y: 0.68, w: 0.32, h: 0.32 },
    ],
    title: { mode: "cell", x: 0.34, y: 0.34, w: 0.32, h: 0.32 },
  },
  {
    id: "bigleft",
    name: "Big left",
    bg: "photos",
    panels: [
      { x: 0, y: 0, w: 0.58, h: 1 },
      { x: 0.6, y: 0, w: 0.4, h: 0.49 },
      { x: 0.6, y: 0.51, w: 0.4, h: 0.49 },
    ],
    title: { mode: "band", x: 0, y: 0.8, w: 1, h: 0.2 },
  },
  {
    id: "bigtop",
    name: "Big top",
    bg: "photos",
    panels: [
      { x: 0, y: 0, w: 1, h: 0.58 },
      { x: 0, y: 0.6, w: 0.32, h: 0.4 },
      { x: 0.34, y: 0.6, w: 0.32, h: 0.4 },
      { x: 0.68, y: 0.6, w: 0.32, h: 0.4 },
    ],
    title: { mode: "band", x: 0, y: 0.8, w: 1, h: 0.2 },
  },
  {
    id: "quad",
    name: "Four square",
    bg: "photos",
    panels: [
      { x: 0, y: 0, w: 0.49, h: 0.49 },
      { x: 0.51, y: 0, w: 0.49, h: 0.49 },
      { x: 0, y: 0.51, w: 0.49, h: 0.49 },
      { x: 0.51, y: 0.51, w: 0.49, h: 0.49 },
    ],
    title: { mode: "band", x: 0, y: 0.78, w: 1, h: 0.22 },
  },
  {
    id: "pair",
    name: "Split pair",
    bg: "photos",
    panels: [
      { x: 0, y: 0, w: 0.49, h: 1 },
      { x: 0.51, y: 0, w: 0.49, h: 1 },
    ],
    title: { mode: "band", x: 0, y: 0, w: 1, h: 0.16 },
  },
  {
    id: "three",
    name: "Three columns",
    bg: "photos",
    panels: [
      { x: 0, y: 0, w: 0.32, h: 1 },
      { x: 0.34, y: 0, w: 0.32, h: 1 },
      { x: 0.68, y: 0, w: 0.32, h: 1 },
    ],
    title: { mode: "band", x: 0, y: 0.78, w: 1, h: 0.22 },
  },
  {
    id: "cards",
    name: "Postcard stack",
    bg: "sky",
    panels: [
      { x: 0.05, y: 0.32, w: 0.3, h: 0.5, rot: -6 },
      { x: 0.35, y: 0.28, w: 0.3, h: 0.5, rot: 0 },
      { x: 0.65, y: 0.32, w: 0.3, h: 0.5, rot: 6 },
    ],
    title: { mode: "sky", x: 0, y: 0.05, w: 1, h: 0.17 },
  },
  {
    id: "single",
    name: "Full bleed",
    bg: "photos",
    panels: [{ x: 0, y: 0, w: 1, h: 1 }],
    title: { mode: "scrim", x: 0, y: 0.66, w: 1, h: 0.34 },
  },
];

// A grade is a canvas filter for the photo, then a colored wash drawn over
// it with a blend mode. The wash tints the photo without hiding it.
export const GRADES = [
  {
    id: "sunset",
    name: "Vice sunset",
    filter: "saturate(1.4) contrast(1.1) brightness(1.04)",
    wash: { top: "#ff9a3d", bottom: "#ff2975", mode: "soft-light", strength: 0.55 },
    veil: "rgba(255,120,40,0.07)",
  },
  {
    id: "midnight",
    name: "Neon midnight",
    filter: "saturate(1.55) contrast(1.14) brightness(0.95)",
    wash: { top: "#2dd4bf", bottom: "#ff2975", mode: "overlay", strength: 0.5 },
    veil: "rgba(20,10,60,0.08)",
  },
  {
    id: "gold",
    name: "Palm gold",
    filter: "saturate(1.25) contrast(1.06) brightness(1.09) sepia(0.28)",
    wash: { top: "#ffd319", bottom: "#ff9a3d", mode: "soft-light", strength: 0.5 },
    veil: "rgba(255,200,60,0.06)",
  },
  {
    id: "grape",
    name: "Grape haze",
    filter: "saturate(1.35) contrast(1.12) brightness(0.94)",
    wash: { top: "#8c1eff", bottom: "#ff2975", mode: "overlay", strength: 0.5 },
    veil: "rgba(80,20,140,0.08)",
  },
  {
    id: "silver",
    name: "Silver chrome",
    filter: "saturate(0.12) contrast(1.28) brightness(1.06)",
    wash: { top: "#ffffff", bottom: "#9aa0b0", mode: "soft-light", strength: 0.35 },
    veil: "rgba(200,210,225,0.05)",
  },
  {
    id: "pop",
    name: "Day pop",
    filter: "saturate(1.65) contrast(1.06) brightness(1.11)",
    wash: { top: "#7dd3fc", bottom: "#fde68a", mode: "soft-light", strength: 0.35 },
    veil: "rgba(255,255,255,0.04)",
  },
];

export function findLayout(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}

export function findGrade(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

export function findSize(id) {
  return SIZES.find((s) => s.id === id) || SIZES[0];
}

// A fresh cover. panels[layoutId] holds one slot per panel: which photo it
// shows, how far it is zoomed, and how far it is panned.
export function freshCover() {
  return {
    layout: "grid9",
    grade: "sunset",
    title: "NEON BOULEVARD",
    subtitle: "chasing the last light",
    badge: "EST. 2026",
    titleStyle: "sunset",
    grain: true,
    vignette: true,
    frame: true,
    halftone: false,
    size: "1080x1080",
    photos: SAMPLES.map((s) => ({ id: s.id, name: s.name, src: s.src })),
    panels: {},
    selected: 0,
  };
}

// Give every layout one slot per panel, cycling through the photos.
export function fillPanels(cover) {
  for (const layout of LAYOUTS) {
    const have = cover.panels[layout.id];
    if (!have || have.length !== layout.panels.length) {
      cover.panels[layout.id] = layout.panels.map((_, i) => ({
        photo: i % Math.max(1, cover.photos.length),
        zoom: 1,
        ox: 0,
        oy: 0,
      }));
    }
  }
  return cover;
}

export function copyCover(cover) {
  return JSON.parse(JSON.stringify(cover));
}
