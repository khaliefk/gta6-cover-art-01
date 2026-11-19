// Neon Boulevard Press: the catalog and the cover state.
//
// A layout is a set of panel boxes in unit coordinates, 0 to 1 across the
// cover, plus one title zone. A panel shows one photo. Unit coordinates
// keep every layout working at each export size without any pixel math.
//
// A panel is [x, y, w, h] with an optional fifth number, the tilt in
// degrees, for the postcard layout. A title zone is [kind, x, y, w, h]
// where kind is one of:
//   "cell"  paints a card,
//   "band"  paints a dark strip,
//   "scrim" fades a dark gradient up from the bottom,
//   "sky"   draws the words straight on the painted sky.

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
  { id: "gradient", name: "Sunset letters" },
  { id: "solid", name: "Plain white" },
  { id: "outline", name: "Hollow outline" },
];

export const LAYOUTS = [
  {
    id: "nine",
    name: "Nine grid",
    bg: "photos",
    panels: [
      [0, 0, 0.32, 0.32],
      [0.34, 0, 0.32, 0.32],
      [0.68, 0, 0.32, 0.32],
      [0, 0.34, 0.32, 0.32],
      [0.68, 0.34, 0.32, 0.32],
      [0, 0.68, 0.32, 0.32],
      [0.34, 0.68, 0.32, 0.32],
      [0.68, 0.68, 0.32, 0.32],
    ],
    title: ["cell", 0.34, 0.34, 0.32, 0.32],
  },
  {
    id: "hero-left",
    name: "Big left",
    bg: "photos",
    panels: [
      [0, 0, 0.56, 1],
      [0.58, 0, 0.42, 0.49],
      [0.58, 0.51, 0.42, 0.49],
    ],
    title: ["band", 0, 0.8, 1, 0.2],
  },
  {
    id: "hero-top",
    name: "Big top",
    bg: "photos",
    panels: [
      [0, 0, 1, 0.56],
      [0, 0.58, 0.32, 0.42],
      [0.34, 0.58, 0.32, 0.42],
      [0.68, 0.58, 0.32, 0.42],
    ],
    title: ["band", 0, 0.8, 1, 0.2],
  },
  {
    id: "four",
    name: "Four square",
    bg: "photos",
    panels: [
      [0, 0, 0.49, 0.49],
      [0.51, 0, 0.49, 0.49],
      [0, 0.51, 0.49, 0.49],
      [0.51, 0.51, 0.49, 0.49],
    ],
    title: ["band", 0, 0.76, 1, 0.24],
  },
  {
    id: "duo",
    name: "Split pair",
    bg: "photos",
    panels: [
      [0, 0, 0.49, 1],
      [0.51, 0, 0.49, 1],
    ],
    title: ["band", 0, 0, 1, 0.15],
  },
  {
    id: "trio",
    name: "Three columns",
    bg: "photos",
    panels: [
      [0, 0, 0.32, 1],
      [0.34, 0, 0.32, 1],
      [0.68, 0, 0.32, 1],
    ],
    title: ["band", 0, 0.78, 1, 0.22],
  },
  {
    id: "cards",
    name: "Postcard stack",
    bg: "sky",
    panels: [
      [0.06, 0.34, 0.29, 0.48, -5],
      [0.355, 0.3, 0.29, 0.48, 0],
      [0.65, 0.34, 0.29, 0.48, 5],
    ],
    title: ["sky", 0, 0.04, 1, 0.18],
  },
  {
    id: "solo",
    name: "Full bleed",
    bg: "photos",
    panels: [[0, 0, 1, 1]],
    title: ["scrim", 0, 0.64, 1, 0.36],
  },
];

// A grade is a canvas filter for the photo, then a colored tint drawn
// over it with a blend mode. The tint colors the photo without hiding it.
// tint is [top color, bottom color, blend mode, strength].
export const GRADES = [
  {
    id: "sunset",
    name: "Sunset Vice",
    filter: "saturate(1.45) contrast(1.12) brightness(1.05)",
    tint: ["#ff9a3d", "#ff2e63", "soft-light", 0.5],
    veil: "rgba(255,120,40,0.06)",
  },
  {
    id: "midnight",
    name: "Midnight Neon",
    filter: "saturate(1.6) contrast(1.15) brightness(0.94)",
    tint: ["#2dd4bf", "#e91e63", "overlay", 0.45],
    veil: "rgba(15,8,55,0.09)",
  },
  {
    id: "gold",
    name: "Golden Hour",
    filter: "saturate(1.3) contrast(1.05) brightness(1.1) sepia(0.3)",
    tint: ["#ffd319", "#ff9a3d", "soft-light", 0.45],
    veil: "rgba(255,200,60,0.05)",
  },
  {
    id: "violet",
    name: "Ultraviolet",
    filter: "saturate(1.4) contrast(1.12) brightness(0.95)",
    tint: ["#8c1eff", "#ff2975", "overlay", 0.45],
    veil: "rgba(70,15,130,0.08)",
  },
  {
    id: "chrome",
    name: "Chrome",
    filter: "saturate(0.1) contrast(1.3) brightness(1.07)",
    tint: ["#ffffff", "#8b93a7", "soft-light", 0.3],
    veil: "rgba(210,220,235,0.05)",
  },
  {
    id: "pop",
    name: "Tropic Pop",
    filter: "saturate(1.7) contrast(1.05) brightness(1.12)",
    tint: ["#7dd3fc", "#fde68a", "soft-light", 0.3],
    veil: "rgba(255,255,255,0.03)",
  },
];

export function findLayout(id) {
  for (const l of LAYOUTS) if (l.id === id) return l;
  return LAYOUTS[0];
}

export function findGrade(id) {
  for (const g of GRADES) if (g.id === id) return g;
  return GRADES[0];
}

export function findSize(id) {
  for (const s of SIZES) if (s.id === id) return s;
  return SIZES[0];
}

// A fresh cover. slots[layoutId] holds one slot per panel: which photo it
// shows, how far it is zoomed, and how far it is panned.
export function freshCover() {
  return {
    layout: "nine",
    grade: "sunset",
    title: "NEON BOULEVARD",
    subtitle: "chasing the last light",
    badge: "EST. 2026",
    titleStyle: "gradient",
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

// Give every layout one slot per panel, cycling through the photos.
export function fillSlots(cover) {
  for (const layout of LAYOUTS) {
    const have = cover.slots[layout.id];
    if (!have || have.length !== layout.panels.length) {
      cover.slots[layout.id] = layout.panels.map((_, i) => ({
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
