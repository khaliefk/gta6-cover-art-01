// Neon Boulevard Press: the data behind the cover.
//
// A layout is a list of panel boxes in unit space, 0 to 1 across the
// cover, plus a title box. Unit space means one layout works at every
// export size. A panel can lean a little, which the postcard layout
// uses. A title box says how the words sit: "card" paints a solid
// block, "strip" paints a dark band, "fade" lifts a gradient from the
// bottom, "sky" writes straight onto the painted sky.

export const SAMPLES = [
  { id: "marina", name: "Marina sunset", src: "samples/marina.jpg" },
  { id: "rooftop", name: "Rooftop night", src: "samples/rooftop.jpg" },
  { id: "boardwalk", name: "Boardwalk day", src: "samples/boardwalk.jpg" },
];

export const SIZES = [
  { id: "1080x1080", label: "Square", w: 1080, h: 1080 },
  { id: "1080x1350", label: "Portrait", w: 1080, h: 1350 },
  { id: "1920x1080", label: "Wide", w: 1920, h: 1080 },
];

export const TITLE_STYLES = [
  { id: "gradient", label: "Sunset fill" },
  { id: "solid", label: "Plain white" },
  { id: "outline", label: "Hollow" },
];

export const GRADES = [
  { id: "vice", label: "Sunset Vice", top: "rgba(255,110,60,0.34)", bottom: "rgba(150,30,120,0.42)", mode: "overlay" },
  { id: "midnight", label: "Midnight Neon", top: "rgba(40,80,255,0.30)", bottom: "rgba(190,30,220,0.38)", mode: "overlay" },
  { id: "golden", label: "Golden Hour", top: "rgba(255,190,80,0.30)", bottom: "rgba(200,90,20,0.30)", mode: "soft-light" },
  { id: "ultraviolet", label: "Ultraviolet", top: "rgba(120,40,255,0.36)", bottom: "rgba(60,10,120,0.44)", mode: "overlay" },
  { id: "chrome", label: "Chrome", top: "rgba(210,225,235,0.22)", bottom: "rgba(60,70,90,0.34)", mode: "soft-light" },
  { id: "tropic", label: "Tropic Pop", top: "rgba(40,220,160,0.26)", bottom: "rgba(255,140,40,0.30)", mode: "overlay" },
];

export const LAYOUTS = [
  {
    id: "grid9", label: "Nine grid", sky: false,
    panels: [
      { x: 0, y: 0, w: 0.32, h: 0.32 }, { x: 0.34, y: 0, w: 0.32, h: 0.32 },
      { x: 0.68, y: 0, w: 0.32, h: 0.32 }, { x: 0, y: 0.34, w: 0.32, h: 0.32 },
      { x: 0.68, y: 0.34, w: 0.32, h: 0.32 }, { x: 0, y: 0.68, w: 0.32, h: 0.32 },
      { x: 0.34, y: 0.68, w: 0.32, h: 0.32 }, { x: 0.68, y: 0.68, w: 0.32, h: 0.32 },
    ],
    title: { mode: "card", x: 0.34, y: 0.34, w: 0.32, h: 0.32 },
  },
  {
    id: "hero-left", label: "Big left", sky: false,
    panels: [
      { x: 0, y: 0, w: 0.56, h: 1 },
      { x: 0.58, y: 0, w: 0.42, h: 0.49 },
      { x: 0.58, y: 0.51, w: 0.42, h: 0.49 },
    ],
    title: { mode: "strip", x: 0, y: 0.8, w: 1, h: 0.2 },
  },
  {
    id: "hero-top", label: "Big top", sky: false,
    panels: [
      { x: 0, y: 0, w: 1, h: 0.56 },
      { x: 0, y: 0.58, w: 0.32, h: 0.42 },
      { x: 0.34, y: 0.58, w: 0.32, h: 0.42 },
      { x: 0.68, y: 0.58, w: 0.32, h: 0.42 },
    ],
    title: { mode: "strip", x: 0, y: 0.8, w: 1, h: 0.2 },
  },
  {
    id: "quad", label: "Four square", sky: false,
    panels: [
      { x: 0, y: 0, w: 0.49, h: 0.49 }, { x: 0.51, y: 0, w: 0.49, h: 0.49 },
      { x: 0, y: 0.51, w: 0.49, h: 0.49 }, { x: 0.51, y: 0.51, w: 0.49, h: 0.49 },
    ],
    title: { mode: "strip", x: 0, y: 0.76, w: 1, h: 0.24 },
  },
  {
    id: "pair", label: "Split pair", sky: false,
    panels: [
      { x: 0, y: 0, w: 0.49, h: 1 },
      { x: 0.51, y: 0, w: 0.49, h: 1 },
    ],
    title: { mode: "strip", x: 0, y: 0, w: 1, h: 0.15 },
  },
  {
    id: "columns", label: "Three columns", sky: false,
    panels: [
      { x: 0, y: 0, w: 0.32, h: 1 },
      { x: 0.34, y: 0, w: 0.32, h: 1 },
      { x: 0.68, y: 0, w: 0.32, h: 1 },
    ],
    title: { mode: "strip", x: 0, y: 0.78, w: 1, h: 0.22 },
  },
  {
    id: "postcards", label: "Postcard stack", sky: true,
    panels: [
      { x: 0.06, y: 0.34, w: 0.29, h: 0.48, tilt: -5 },
      { x: 0.355, y: 0.3, w: 0.29, h: 0.48, tilt: 0 },
      { x: 0.65, y: 0.34, w: 0.29, h: 0.48, tilt: 5 },
    ],
    title: { mode: "sky", x: 0, y: 0.04, w: 1, h: 0.18 },
  },
  {
    id: "bleed", label: "Full bleed", sky: false,
    panels: [{ x: 0, y: 0, w: 1, h: 1 }],
    title: { mode: "fade", x: 0, y: 0.62, w: 1, h: 0.38 },
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

// A fresh cover: every panel gets a sample photo in turn, the first
// panel starts selected, and the title reads like a game cover.
export function freshState() {
  return {
    layout: "grid9",
    grade: "vice",
    titleStyle: "gradient",
    size: "1080x1080",
    title: "NEON BOULEVARD",
    subtitle: "Vice City nights, one frame at a time",
    badge: "VOL. 1",
    grain: true,
    vignette: true,
    halftone: false,
    selected: 0,
    panels: Array.from({ length: 9 }, (_, i) => ({
      photo: SAMPLES[i % SAMPLES.length].id,
      px: 0,
      py: 0,
      zoom: 1,
    })),
  };
}
