// Neon Boulevard Press: the data the cover maker works with.
//
// Layouts are plain rect lists in unit space, so the painter never has
// to know which layout is active. A rect is {x, y, w, h, r} where r is
// an optional rotation in degrees around the rect centre. Grades are a
// canvas filter string plus one wash colour laid over the photo.

export const SIZES = {
  "1080x1080": { w: 1080, h: 1080, label: "Square 1080 x 1080" },
  "1080x1350": { w: 1080, h: 1350, label: "Portrait 1080 x 1350" },
  "1920x1080": { w: 1920, h: 1080, label: "Wide 1920 x 1080" },
};

export const LAYOUTS = {
  grid9: {
    label: "Nine Grid",
    slots: 9,
    rects: () => {
      const out = [];
      for (let row = 0; row < 3; row++)
        for (let col = 0; col < 3; col++)
          out.push({ x: col / 3, y: row / 3, w: 1 / 3, h: 1 / 3, r: 0 });
      return out;
    },
  },
  heroLeft: {
    label: "Big Left",
    slots: 4,
    rects: () => [
      { x: 0, y: 0, w: 0.62, h: 1, r: 0 },
      { x: 0.62, y: 0, w: 0.38, h: 1 / 3, r: 0 },
      { x: 0.62, y: 1 / 3, w: 0.38, h: 1 / 3, r: 0 },
      { x: 0.62, y: 2 / 3, w: 0.38, h: 1 / 3, r: 0 },
    ],
  },
  heroTop: {
    label: "Big Top",
    slots: 4,
    rects: () => [
      { x: 0, y: 0, w: 1, h: 0.62, r: 0 },
      { x: 0, y: 0.62, w: 1 / 3, h: 0.38, r: 0 },
      { x: 1 / 3, y: 0.62, w: 1 / 3, h: 0.38, r: 0 },
      { x: 2 / 3, y: 0.62, w: 1 / 3, h: 0.38, r: 0 },
    ],
  },
  four: {
    label: "Four Square",
    slots: 4,
    rects: () => [
      { x: 0, y: 0, w: 0.5, h: 0.5, r: 0 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5, r: 0 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5, r: 0 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5, r: 0 },
    ],
  },
  pair: {
    label: "Split Pair",
    slots: 2,
    rects: () => [
      { x: 0, y: 0, w: 0.5, h: 1, r: 0 },
      { x: 0.5, y: 0, w: 0.5, h: 1, r: 0 },
    ],
  },
  trio: {
    label: "Three Columns",
    slots: 3,
    rects: () => [
      { x: 0, y: 0, w: 1 / 3, h: 1, r: 0 },
      { x: 1 / 3, y: 0, w: 1 / 3, h: 1, r: 0 },
      { x: 2 / 3, y: 0, w: 1 / 3, h: 1, r: 0 },
    ],
  },
  postcards: {
    label: "Postcard Stack",
    slots: 3,
    rects: () => [
      { x: 0.08, y: 0.06, w: 0.6, h: 0.56, r: -4 },
      { x: 0.32, y: 0.22, w: 0.6, h: 0.56, r: 3 },
      { x: 0.14, y: 0.42, w: 0.6, h: 0.56, r: -2 },
    ],
  },
  bleed: {
    label: "Full Bleed",
    slots: 1,
    rects: () => [{ x: 0, y: 0, w: 1, h: 1, r: 0 }],
  },
};

export const GRADES = {
  vice: {
    label: "Sunset Vice",
    filter: "saturate(1.45) contrast(1.08) brightness(1.02)",
    wash: "rgba(255, 64, 140, 0.16)",
  },
  midnight: {
    label: "Midnight Neon",
    filter: "saturate(1.35) contrast(1.18) brightness(0.92) hue-rotate(18deg)",
    wash: "rgba(40, 80, 255, 0.20)",
  },
  golden: {
    label: "Golden Hour",
    filter: "saturate(1.3) contrast(1.05) brightness(1.06) sepia(0.22)",
    wash: "rgba(255, 170, 40, 0.14)",
  },
  ultra: {
    label: "Ultraviolet",
    filter: "saturate(1.7) contrast(1.12) hue-rotate(55deg)",
    wash: "rgba(150, 40, 255, 0.18)",
  },
  chrome: {
    label: "Chrome",
    filter: "saturate(0.25) contrast(1.25) brightness(1.08)",
    wash: "rgba(210, 225, 255, 0.10)",
  },
  tropic: {
    label: "Tropic Pop",
    filter: "saturate(1.8) contrast(1.1) brightness(1.04) hue-rotate(-12deg)",
    wash: "rgba(0, 220, 160, 0.12)",
  },
};

export const TITLE_STYLES = {
  gradient: "Gradient",
  solid: "Solid",
  outline: "Outline",
};

export const SAMPLES = [
  { id: "avenue", name: "Avenue", src: "./samples/avenue.jpg" },
  { id: "harbor", name: "Harbor", src: "./samples/harbor.jpg" },
  { id: "rooftop", name: "Rooftop", src: "./samples/rooftop.jpg" },
];

export function freshPanels() {
  return Array.from({ length: 9 }, (_, i) => ({
    photo: i % 3,
    zoom: 1,
    x: 0,
    y: 0,
  }));
}

export function freshState() {
  return {
    layout: "grid9",
    grade: "vice",
    titleStyle: "gradient",
    title: "NEON BOULEVARD",
    subtitle: "Vice City Nights",
    ribbon: "WANTED",
    grain: true,
    vignette: true,
    halftone: false,
    size: "1080x1350",
    selected: 0,
    panels: freshPanels(),
  };
}

// A small snapshot of everything undo and redo need, photos excluded.
export function snapshot(state) {
  return JSON.stringify({
    layout: state.layout,
    grade: state.grade,
    titleStyle: state.titleStyle,
    title: state.title,
    subtitle: state.subtitle,
    ribbon: state.ribbon,
    grain: state.grain,
    vignette: state.vignette,
    halftone: state.halftone,
    size: state.size,
    selected: state.selected,
    panels: state.panels,
  });
}

export function restore(state, text) {
  Object.assign(state, JSON.parse(text));
}
