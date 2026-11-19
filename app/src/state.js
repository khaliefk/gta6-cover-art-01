// Neon Boulevard Press: state, layouts and grades.
// Every layout is a set of panel rectangles in unit coordinates (0..1 across
// the cover), plus a title zone. Panels get one photo each. The same layout
// works at any export size because nothing here names pixels.

export const SAMPLES = [
  { id: "boulevard", name: "Boulevard", src: "samples/boulevard.jpg" },
  { id: "neon", name: "Neon street", src: "samples/neon.jpg" },
  { id: "pier", name: "Pier", src: "samples/pier.jpg" },
];

export const SIZES = [
  { id: "1080x1080", name: "Square 1080 x 1080", w: 1080, h: 1080 },
  { id: "1080x1350", name: "Portrait 1080 x 1350", w: 1080, h: 1350 },
  { id: "1920x1080", name: "Wide 1920 x 1080", w: 1920, h: 1080 },
];

export const TITLE_STYLES = [
  { id: "sunset", name: "Sunset letters" },
  { id: "white", name: "White letters" },
  { id: "outline", name: "Outline letters" },
];

// A layout: panels to fill with photos, a title zone, and what sits behind
// the panels ("panels" means the photos cover the whole cover, "sky" means
// a painted sunset sky shows between the cards).
export const LAYOUTS = [
  {
    id: "nine",
    name: "Nine grid",
    bg: "panels",
    panels: [
      { x: 0, y: 0, w: 0.324, h: 0.324 },
      { x: 0.338, y: 0, w: 0.324, h: 0.324 },
      { x: 0.676, y: 0, w: 0.324, h: 0.324 },
      { x: 0, y: 0.338, w: 0.324, h: 0.324 },
      { x: 0.676, y: 0.338, w: 0.324, h: 0.324 },
      { x: 0, y: 0.676, w: 0.324, h: 0.324 },
      { x: 0.338, y: 0.676, w: 0.324, h: 0.324 },
      { x: 0.676, y: 0.676, w: 0.324, h: 0.324 },
    ],
    title: { mode: "cell", x: 0.338, y: 0.338, w: 0.324, h: 0.324 },
  },
  {
    id: "hero-left",
    name: "Hero left",
    bg: "panels",
    panels: [
      { x: 0, y: 0, w: 0.6, h: 1 },
      { x: 0.614, y: 0, w: 0.386, h: 0.486 },
      { x: 0.614, y: 0.514, w: 0.386, h: 0.486 },
    ],
    title: { mode: "band", x: 0, y: 0.82, w: 1, h: 0.18 },
  },
  {
    id: "hero-top",
    name: "Hero top",
    bg: "panels",
    panels: [
      { x: 0, y: 0, w: 1, h: 0.56 },
      { x: 0, y: 0.574, w: 0.324, h: 0.426 },
      { x: 0.338, y: 0.574, w: 0.324, h: 0.426 },
      { x: 0.676, y: 0.574, w: 0.324, h: 0.426 },
    ],
    title: { mode: "band", x: 0, y: 0.82, w: 1, h: 0.18 },
  },
  {
    id: "four",
    name: "Four square",
    bg: "panels",
    panels: [
      { x: 0, y: 0, w: 0.493, h: 0.493 },
      { x: 0.507, y: 0, w: 0.493, h: 0.493 },
      { x: 0, y: 0.507, w: 0.493, h: 0.493 },
      { x: 0.507, y: 0.507, w: 0.493, h: 0.493 },
    ],
    title: { mode: "band", x: 0, y: 0.8, w: 1, h: 0.2 },
  },
  {
    id: "duo",
    name: "Split duo",
    bg: "panels",
    panels: [
      { x: 0, y: 0, w: 0.493, h: 1 },
      { x: 0.507, y: 0, w: 0.493, h: 1 },
    ],
    title: { mode: "band", x: 0, y: 0, w: 1, h: 0.15 },
  },
  {
    id: "triptych",
    name: "Triptych",
    bg: "panels",
    panels: [
      { x: 0, y: 0, w: 0.324, h: 1 },
      { x: 0.338, y: 0, w: 0.324, h: 1 },
      { x: 0.676, y: 0, w: 0.324, h: 1 },
    ],
    title: { mode: "band", x: 0, y: 0.8, w: 1, h: 0.2 },
  },
  {
    id: "postcards",
    name: "Postcard stack",
    bg: "sky",
    panels: [
      { x: 0.06, y: 0.3, w: 0.3, h: 0.52, rot: -6 },
      { x: 0.35, y: 0.26, w: 0.3, h: 0.52, rot: 0 },
      { x: 0.64, y: 0.3, w: 0.3, h: 0.52, rot: 6 },
    ],
    title: { mode: "sky", x: 0, y: 0.04, w: 1, h: 0.18 },
  },
  {
    id: "bleed",
    name: "Full bleed",
    bg: "panels",
    panels: [{ x: 0, y: 0, w: 1, h: 1 }],
    title: { mode: "scrim", x: 0, y: 0.68, w: 1, h: 0.32 },
  },
];

// A grade: a canvas filter for the photo, then a coloured wash drawn over
// it. The wash uses a blend mode so the photo still shows through.
export const GRADES = [
  {
    id: "sunset",
    name: "Sunset",
    filter: "saturate(1.35) contrast(1.08) brightness(1.03)",
    wash: { from: "#ff9a3d", to: "#ff2975", blend: "soft-light", alpha: 0.55 },
    tint: "rgba(255,120,40,0.07)",
  },
  {
    id: "neon",
    name: "Neon night",
    filter: "saturate(1.5) contrast(1.12) brightness(0.96)",
    wash: { from: "#2dd4bf", to: "#ff2975", blend: "overlay", alpha: 0.5 },
    tint: "rgba(20,10,60,0.08)",
  },
  {
    id: "gold",
    name: "Palm gold",
    filter: "saturate(1.25) contrast(1.05) brightness(1.08) sepia(0.25)",
    wash: { from: "#ffd319", to: "#ff9a3d", blend: "soft-light", alpha: 0.5 },
    tint: "rgba(255,200,60,0.06)",
  },
  {
    id: "violet",
    name: "Violet haze",
    filter: "saturate(1.3) contrast(1.1) brightness(0.95)",
    wash: { from: "#8c1eff", to: "#ff2975", blend: "overlay", alpha: 0.5 },
    tint: "rgba(80,20,140,0.08)",
  },
  {
    id: "chrome",
    name: "Chrome",
    filter: "saturate(0.15) contrast(1.25) brightness(1.05)",
    wash: { from: "#ffffff", to: "#9aa0b0", blend: "soft-light", alpha: 0.35 },
    tint: "rgba(200,210,225,0.05)",
  },
  {
    id: "daypop",
    name: "Day pop",
    filter: "saturate(1.6) contrast(1.05) brightness(1.1)",
    wash: { from: "#7dd3fc", to: "#fde68a", blend: "soft-light", alpha: 0.35 },
    tint: "rgba(255,255,255,0.04)",
  },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

export function sizeById(id) {
  return SIZES.find((s) => s.id === id) || SIZES[0];
}

// Fresh cover state. slots[layoutId] holds one slot per panel: which photo
// it shows, how far it is zoomed, and how far it is panned.
export function freshState() {
  return {
    layout: "nine",
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
    slots: {},
    selected: 0,
  };
}

// Make sure every layout has a slot per panel, cycling through the photos.
export function ensureSlots(state) {
  for (const layout of LAYOUTS) {
    const have = state.slots[layout.id];
    if (!have || have.length !== layout.panels.length) {
      state.slots[layout.id] = layout.panels.map((_, i) => ({
        photo: i % Math.max(1, state.photos.length),
        zoom: 1,
        ox: 0,
        oy: 0,
      }));
    }
  }
  return state;
}

export function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}
