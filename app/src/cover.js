// The cover engine of Vice Lights Press: layouts, grades, title styles,
// panel drawing, grain, vignette and PNG export. Pure canvas 2D, no network.

export const LAYOUTS = [
  { id: 'hero3', label: 'Hero + 3', panels: 4 },
  { id: 'grid4', label: 'Four Grid', panels: 4 },
  { id: 'grid9', label: 'Nine Grid', panels: 9 },
  { id: 'bleed', label: 'Full Bleed', panels: 1 },
  { id: 'tilted', label: 'Tilted Snaps', panels: 3 },
  { id: 'strip', label: 'Story Strip', panels: 3 },
];

export const GRADES = [
  { id: 'sunset', label: 'Vice Sunset', top: 'rgba(255, 126, 95, 0.16)', bottom: 'rgba(43, 16, 85, 0.34)', accent: '#ff7e5f', ink: '#1c0b2e' },
  { id: 'neon', label: 'Neon Pink', top: 'rgba(255, 46, 136, 0.2)', bottom: 'rgba(10, 4, 32, 0.4)', accent: '#ff2e88', ink: '#14081f' },
  { id: 'golden', label: 'Golden Hour', top: 'rgba(255, 211, 25, 0.14)', bottom: 'rgba(120, 60, 10, 0.32)', accent: '#ffd319', ink: '#2e1a05' },
  { id: 'midnight', label: 'Midnight Noir', top: 'rgba(60, 90, 220, 0.16)', bottom: 'rgba(4, 6, 20, 0.5)', accent: '#5f7cff', ink: '#05060f' },
  { id: 'palm', label: 'Palm Fade', top: 'rgba(63, 210, 192, 0.14)', bottom: 'rgba(6, 60, 70, 0.38)', accent: '#3fd2c0', ink: '#062a30' },
  { id: 'mono', label: 'Mono Noir', top: 'rgba(255, 255, 255, 0.06)', bottom: 'rgba(0, 0, 0, 0.42)', accent: '#e8e8e8', ink: '#111111', mono: true },
];

export const TITLE_STYLES = [
  { id: 'halftone', label: 'Halftone Block' },
  { id: 'band', label: 'Outline Band' },
  { id: 'script', label: 'Neon Script' },
];

export const EXPORT_SIZES = [
  { id: '1080x1080', label: 'Square · 1080 × 1080', w: 1080, h: 1080 },
  { id: '1080x1350', label: 'Portrait · 1080 × 1350', w: 1080, h: 1350 },
  { id: '1920x1080', label: 'Wide · 1920 × 1080', w: 1920, h: 1080 },
];

export function defaultState() {
  return {
    layout: 'hero3',
    grade: 'sunset',
    titleStyle: 'halftone',
    title: 'VICE LIGHTS',
    subtitle: 'A LEONIDA STORY',
    size: '1080x1080',
    heat: 4,
    badge: 'EST. 2026',
    panels: [],
  };
}

export function layoutDef(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}

export function gradeDef(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

export function sizeDef(id) {
  return EXPORT_SIZES.find((s) => s.id === id) || EXPORT_SIZES[0];
}

/** Panel rectangles for a layout, as fractions of the cover. */
export function panelRects(layoutId, w, h) {
  const g = Math.round(Math.min(w, h) * 0.014);
  const pad = Math.round(Math.min(w, h) * 0.02);
  const R = (x, y, rw, rh, rot = 0) => ({ x, y, w: rw, h: rh, rot });
  switch (layoutId) {
    case 'grid4': {
      const cw = (w - pad * 2 - g) / 2;
      const ch = (h - pad * 2 - g) / 2;
      return [
        R(pad, pad, cw, ch), R(pad + cw + g, pad, cw, ch),
        R(pad, pad + ch + g, cw, ch), R(pad + cw + g, pad + ch + g, cw, ch),
      ];
    }
    case 'grid9': {
      const cw = (w - pad * 2 - g * 2) / 3;
      const ch = (h - pad * 2 - g * 2) / 3;
      const out = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          out.push(R(pad + c * (cw + g), pad + r * (ch + g), cw, ch));
        }
      }
      return out;
    }
    case 'bleed':
      return [R(0, 0, w, h)];
    case 'tilted': {
      const cw = w * 0.34;
      const ch = h * 0.52;
      const cy = h * 0.16;
      return [
        R(w * 0.05, cy, cw, ch, -0.1),
        R(w * 0.33, cy + h * 0.05, cw, ch, 0.03),
        R(w * 0.61, cy, cw, ch, 0.09),
      ];
    }
    case 'strip': {
      const ch = (h - pad * 2 - g * 2) / 3;
      const cw = w - pad * 2;
      return [R(pad, pad, cw, ch), R(pad, pad + ch + g, cw, ch), R(pad, pad + (ch + g) * 2, cw, ch)];
    }
    case 'hero3':
    default: {
      const heroH = h * 0.6 - g / 2;
      const smallH = h - heroH - g - pad * 2;
      const smallW = (w - pad * 2 - g * 2) / 3;
      return [
        R(pad, pad, w - pad * 2, heroH),
        R(pad, pad + heroH + g, smallW, smallH),
        R(pad + smallW + g, pad + heroH + g, smallW, smallH),
        R(pad + (smallW + g) * 2, pad + heroH + g, smallW, smallH),
      ];
    }
  }
}

/** Where the title block sits for a layout. */
function titleZone(layoutId, w, h) {
  const pad = Math.round(Math.min(w, h) * 0.02);
  switch (layoutId) {
    case 'bleed':
      return { x: w * 0.06, y: h * 0.74, w: w * 0.88, align: 'left' };
    case 'tilted':
      return { x: w * 0.06, y: h * 0.76, w: w * 0.88, align: 'center' };
    case 'strip':
      return { x: pad, y: h - pad - h * 0.1, w: w - pad * 2, align: 'center' };
    default:
      return { x: w * 0.05, y: h * 0.86, w: w * 0.9, align: 'center' };
  }
}

function drawPhotoCover(ctx, img, rect, zoom, ox, oy) {
  const iw = img.width || img.naturalWidth;
  const ih = img.height || img.naturalHeight;
  if (!iw || !ih) return;
  const scale = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = rect.x + (rect.w - dw) / 2 + ox * rect.w * 0.1;
  const dy = rect.y + (rect.h - dh) / 2 + oy * rect.h * 0.1;
  ctx.drawImage(img, dx, dy, dw, dh);
}

function applyGrade(ctx, rect, grade, w) {
  if (grade.mono) {
    ctx.save();
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = '#000';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
  }
  const wash = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  wash.addColorStop(0, grade.top);
  wash.addColorStop(1, grade.bottom);
  ctx.fillStyle = wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = grade.ink;
  ctx.lineWidth = Math.max(2, w * 0.004);
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  // Inner shade at the panel bottom for legibility.
  const shade = ctx.createLinearGradient(0, rect.y + rect.h * 0.6, 0, rect.y + rect.h);
  shade.addColorStop(0, 'rgba(0,0,0,0)');
  shade.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = shade;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
}

function grainPattern(ctx, w, h) {
  const s = 140;
  const noise = document.createElement('canvas');
  noise.width = s;
  noise.height = s;
  const nx = noise.getContext('2d');
  const img = nx.createImageData(s, s);
  let seed = 1337;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(rnd() * 255);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  nx.putImageData(img, 0, 0);
  const pattern = ctx.createPattern(noise, 'repeat');
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function vignette(ctx, w, h) {
  const r = Math.hypot(w, h) / 2;
  const vg = ctx.createRadialGradient(w / 2, h / 2, r * 0.45, w / 2, h / 2, r);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.34)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);
}

function star(ctx, cx, cy, r, fill) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawTitle(ctx, state, grade, w, h) {
  const zone = titleZone(state.layout, w, h);
  const title = (state.title || 'VICE LIGHTS').toUpperCase();
  const sub = (state.subtitle || '').toUpperCase();
  const size = Math.min(zone.w / Math.max(6, title.length * 0.62), h * 0.085);
  const subSize = Math.max(10, size * 0.26);
  const gap = size * 0.22;
  const dotsH = state.titleStyle === 'halftone' ? size * 0.5 : 0;
  // Stack the block from a bottom anchor so the subtitle never runs off
  // the cover: title, then the halftone dots, then the subtitle.
  const blockH = size + dotsH + (sub ? gap + subSize : 0);
  const bottom = Math.min(h - h * 0.02, zone.y + blockH);
  const top = bottom - blockH;
  const cx = zone.align === 'left' ? zone.x : zone.x + zone.w / 2;
  const cy = top + size / 2;
  const dotsY = top + size + dotsH / 2;
  const subY = top + size + dotsH + gap + subSize / 2;
  ctx.save();
  ctx.textAlign = zone.align === 'left' ? 'left' : 'center';
  ctx.textBaseline = 'middle';
  if (state.titleStyle === 'band') {
    const bandH = size * 1.5;
    const bandW = Math.min(zone.w, size * title.length * 0.66 + size);
    const bx = zone.align === 'left' ? zone.x : cx - bandW / 2;
    ctx.fillStyle = grade.accent;
    ctx.fillRect(bx, cy - bandH / 2, bandW, bandH);
    ctx.strokeStyle = grade.ink;
    ctx.lineWidth = Math.max(2, w * 0.003);
    ctx.strokeRect(bx, cy - bandH / 2, bandW, bandH);
    ctx.fillStyle = grade.ink;
    ctx.font = `900 ${size}px "Liberation Sans", sans-serif`;
    ctx.fillText(title, zone.align === 'left' ? bx + size * 0.4 : cx, cy + size * 0.04);
  } else if (state.titleStyle === 'script') {
    ctx.shadowColor = grade.accent;
    ctx.shadowBlur = size * 0.45;
    ctx.fillStyle = '#fff8ec';
    ctx.font = `italic 900 ${size * 1.25}px "Liberation Serif", serif`;
    ctx.fillText(title, cx, cy);
    ctx.shadowBlur = 0;
  } else {
    // Halftone Block: dark offset copy, white face, dotted underline.
    ctx.fillStyle = grade.ink;
    ctx.font = `900 ${size}px "Liberation Sans", sans-serif`;
    ctx.fillText(title, cx + size * 0.07, cy + size * 0.09);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(title, cx, cy);
    ctx.fillStyle = grade.accent;
    const dots = Math.floor(zone.w / (size * 0.42));
    const startX = zone.align === 'left' ? zone.x : cx - (dots * size * 0.42) / 2;
    for (let i = 0; i < dots; i++) {
      ctx.beginPath();
      ctx.arc(startX + i * size * 0.42 + size * 0.14, dotsY, size * 0.09, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (sub) {
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.font = `700 ${subSize}px "Liberation Sans", sans-serif`;
    try {
      ctx.letterSpacing = `${Math.max(2, size * 0.08)}px`;
    } catch (e) {
      /* letterSpacing is new; older engines ignore it. */
    }
    ctx.fillText(sub, cx, subY);
    try {
      ctx.letterSpacing = '0px';
    } catch (e) {
      /* ignore */
    }
  }
  ctx.restore();
}

function drawChrome(ctx, state, grade, w, h) {
  // Heat meter: five stars, top right.
  const starR = Math.max(8, w * 0.016);
  const gap = starR * 2.4;
  const total = gap * 5;
  const x0 = w - total - w * 0.03;
  const y0 = h * 0.035 + starR;
  for (let i = 0; i < 5; i++) {
    star(ctx, x0 + i * gap + starR, y0, starR, i < state.heat ? '#ffd319' : 'rgba(255,255,255,0.28)');
  }
  // Badge ribbon, bottom left.
  if (state.badge) {
    ctx.save();
    ctx.translate(w * 0.03, h * 0.965);
    ctx.rotate(-0.03);
    ctx.font = `700 ${Math.max(11, w * 0.014)}px "Liberation Sans", sans-serif`;
    const tw = ctx.measureText(state.badge).width;
    ctx.fillStyle = grade.accent;
    ctx.fillRect(0, -w * 0.014, tw + w * 0.02, w * 0.028);
    ctx.fillStyle = grade.ink;
    ctx.textBaseline = 'middle';
    ctx.fillText(state.badge, w * 0.01, 0);
    ctx.restore();
  }
}

/**
 * Render the cover described by `state` onto ctx at w x h.
 * `photos` maps a panel photo id to a drawable image or canvas.
 */
export function renderCover(ctx, state, photos, w, h) {
  const grade = gradeDef(state.grade);
  const rects = panelRects(state.layout, w, h);
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = grade.ink;
  ctx.fillRect(0, 0, w, h);
  // Tilted Snaps paints its backdrop first.
  if (state.layout === 'tilted') {
    const back = state.panels[0] && photos[state.panels[0].photo];
    if (back) {
      ctx.save();
      ctx.globalAlpha = 0.55;
      drawPhotoCover(ctx, back, { x: 0, y: 0, w, h }, 1.15, 0, 0);
      ctx.restore();
      ctx.fillStyle = 'rgba(10, 4, 24, 0.35)';
      ctx.fillRect(0, 0, w, h);
    }
  }
  rects.forEach((rect, i) => {
    const panel = state.panels[i] || {};
    const img = panel.photo ? photos[panel.photo] : null;
    ctx.save();
    ctx.translate(rect.x, rect.y);
    if (rect.rot) {
      ctx.translate(rect.w / 2, rect.h / 2);
      ctx.rotate(rect.rot);
      ctx.translate(-rect.w / 2, -rect.h / 2);
    }
    const local = { x: 0, y: 0, w: rect.w, h: rect.h };
    ctx.beginPath();
    ctx.rect(local.x, local.y, local.w, local.h);
    ctx.clip();
    if (img) drawPhotoCover(ctx, img, local, panel.zoom || 1, panel.ox || 0, panel.oy || 0);
    else {
      ctx.fillStyle = '#241040';
      ctx.fillRect(local.x, local.y, local.w, local.h);
    }
    applyGrade(ctx, local, grade, w);
    ctx.restore();
    if (rect.rot) {
      ctx.save();
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate(rect.rot);
      ctx.translate(-rect.w / 2, -rect.h / 2);
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = w * 0.02;
      ctx.shadowOffsetY = w * 0.008;
      ctx.strokeStyle = '#fff8ec';
      ctx.lineWidth = Math.max(3, w * 0.006);
      ctx.strokeRect(0, 0, rect.w, rect.h);
      ctx.restore();
    }
  });
  grainPattern(ctx, w, h);
  vignette(ctx, w, h);
  drawTitle(ctx, state, grade, w, h);
  drawChrome(ctx, state, grade, w, h);
  ctx.restore();
}

/** Render the cover to a fresh canvas at w x h and return it. */
export function coverCanvas(state, photos, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  renderCover(canvas.getContext('2d'), state, photos, w, h);
  return canvas;
}

/** Export the cover as a PNG blob at the state's chosen size. */
export function exportCover(state, photos) {
  const size = sizeDef(state.size);
  const canvas = coverCanvas(state, photos, size.w, size.h);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}
