// Neon Coast Cover Studio: the cover engine.
// Draws a multi-panel poster cover on a 2D canvas from a state object.
// Every layout is computed in fractions of the canvas size, so the same
// state renders at preview size and at full export size (1080x1080,
// 1080x1350, 1920x1080) with identical composition.

export const LAYOUTS = {
  grid9: { name: 'Vice Grid', panels: 9, blurb: 'Nine-panel poster grid' },
  hero3: { name: 'Hero + Three', panels: 4, blurb: 'One hero, three stacked' },
  tilted: { name: 'Tilted Snaps', panels: 4, blurb: 'Snapshots over full bleed' },
  duo: { name: 'Split Duo', panels: 2, blurb: 'Two halves, one story' },
  strip: { name: 'Sunset Strip', panels: 4, blurb: 'Hero strip, three below' },
  story: { name: 'Story Stack', panels: 3, blurb: 'Tall stack for stories' },
};

export const GRADES = {
  sunset: { name: 'Vice Sunset', top: 'rgba(255,122,26,0.28)', bottom: 'rgba(214,32,120,0.42)', glow: '#ff7a1a' },
  neon: { name: 'Neon Night', top: 'rgba(0,229,255,0.20)', bottom: 'rgba(255,0,153,0.42)', glow: '#ff0099' },
  gold: { name: 'Palm Gold', top: 'rgba(255,196,66,0.30)', bottom: 'rgba(120,40,0,0.38)', glow: '#ffc442' },
  noir: { name: 'Teal Noir', top: 'rgba(0,180,180,0.22)', bottom: 'rgba(4,10,40,0.55)', glow: '#00e5ff' },
  candy: { name: 'Candy Pink', top: 'rgba(255,80,180,0.30)', bottom: 'rgba(120,0,160,0.45)', glow: '#ff50b4' },
  ink: { name: 'Ink Mono', top: 'rgba(255,255,255,0.10)', bottom: 'rgba(0,0,0,0.55)', glow: '#ffffff' },
};

export const SIZES = {
  square: { name: 'Square 1080 x 1080', w: 1080, h: 1080 },
  portrait: { name: 'Portrait 1080 x 1350', w: 1080, h: 1350 },
  wide: { name: 'Wide 1920 x 1080', w: 1920, h: 1080 },
};

export function defaultState() {
  return {
    layout: 'grid9',
    grade: 'sunset',
    size: 'wide',
    title: 'NEON SHORE',
    subtitle: 'one last summer on the coast',
    badge: 'VICE COAST',
    stars: 4,
    frame: true,
    grain: true,
    halftone: true,
    panels: [
      { photo: 0, zoom: 1.15, ox: 0, oy: 0 },
      { photo: 1, zoom: 1.2, ox: 0, oy: -0.04 },
      { photo: 2, zoom: 1.15, ox: 0, oy: 0 },
      { photo: 1, zoom: 1.25, ox: 0.05, oy: 0 },
      { photo: 0, zoom: 1.1, ox: 0, oy: 0.03 },
      { photo: 2, zoom: 1.2, ox: -0.04, oy: 0 },
      { photo: 2, zoom: 1.15, ox: 0, oy: 0 },
      { photo: 0, zoom: 1.2, ox: 0, oy: -0.03 },
      { photo: 1, zoom: 1.15, ox: 0, oy: 0 },
    ],
  };
}

// Panel rectangles as fractions of the canvas, plus a rotation in radians
// and a flag for a white snapshot border. The title band sits at the foot.
export function layoutPanels(layout, w, h) {
  const g = Math.max(6, Math.round(Math.min(w, h) * 0.008));
  const titleH = h * 0.21;
  const bodyH = h - titleH;
  const inset = (x, y, pw, ph, rot = 0, snap = false) => ({ x, y, w: pw, h: ph, rot, snap });
  switch (layout) {
    case 'hero3': {
      const rw = w * 0.34;
      return [
        inset(g, g, w * 0.66 - g * 1.5, bodyH - g * 2),
        inset(w * 0.66 + g * 0.5, g, rw - g * 1.5, bodyH / 3 - g * 1.33),
        inset(w * 0.66 + g * 0.5, bodyH / 3 + g * 0.5, rw - g * 1.5, bodyH / 3 - g * 1.33),
        inset(w * 0.66 + g * 0.5, (bodyH / 3) * 2 + g * 0.5, rw - g * 1.5, bodyH / 3 - g * 1.33),
      ];
    }
    case 'tilted': {
      return [
        inset(0, 0, w, bodyH),
        inset(w * 0.06, bodyH * 0.10, w * 0.30, bodyH * 0.52, -0.07, true),
        inset(w * 0.36, bodyH * 0.28, w * 0.30, bodyH * 0.52, 0.05, true),
        inset(w * 0.65, bodyH * 0.08, w * 0.30, bodyH * 0.52, -0.03, true),
      ];
    }
    case 'duo': {
      return [
        inset(g, g, w / 2 - g * 1.5, bodyH - g * 2),
        inset(w / 2 + g * 0.5, g, w / 2 - g * 1.5, bodyH - g * 2),
      ];
    }
    case 'strip': {
      return [
        inset(g, g, w - g * 2, bodyH * 0.58 - g),
        inset(g, bodyH * 0.58 + g, w / 3 - g * 1.33, bodyH * 0.42 - g * 2),
        inset(w / 3 + g * 0.67, bodyH * 0.58 + g, w / 3 - g * 1.33, bodyH * 0.42 - g * 2),
        inset((w / 3) * 2 + g * 0.67, bodyH * 0.58 + g, w / 3 - g * 1.33, bodyH * 0.42 - g * 2),
      ];
    }
    case 'story': {
      return [
        inset(g, g, w - g * 2, bodyH * 0.55 - g),
        inset(g, bodyH * 0.55 + g, w / 2 - g * 1.5, bodyH * 0.45 - g * 2),
        inset(w / 2 + g * 0.5, bodyH * 0.55 + g, w / 2 - g * 1.5, bodyH * 0.45 - g * 2),
      ];
    }
    case 'grid9':
    default: {
      const cw = (w - g * 4) / 3;
      const ch = (bodyH - g * 4) / 3;
      const out = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          out.push(inset(g + c * (cw + g), g + r * (ch + g), cw, ch));
        }
      }
      return out;
    }
  }
}

function drawPhotoInto(ctx, img, rect, panel) {
  if (!img) return;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(rect.w / iw, rect.h / ih) * (panel.zoom || 1);
  const pw = iw * scale;
  const ph = ih * scale;
  const cx = rect.x + rect.w / 2 + (panel.ox || 0) * rect.w;
  const cy = rect.y + rect.h / 2 + (panel.oy || 0) * rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(img, cx - pw / 2, cy - ph / 2, pw, ph);
  ctx.restore();
}

function fitFont(ctx, text, maxW, startPx, family, weight = '') {
  let size = startPx;
  ctx.font = `${weight} ${size}px ${family}`;
  while (size > 10 && ctx.measureText(text).width > maxW) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

function drawHalftone(ctx, x, y, w, h, color) {
  const step = Math.max(10, Math.round(w / 46));
  ctx.fillStyle = color;
  for (let yy = y; yy < y + h; yy += step) {
    for (let xx = x; xx < x + w; xx += step) {
      const t = 1 - (yy - y) / h;
      const r = Math.max(0.6, step * 0.22 * t);
      ctx.beginPath();
      ctx.arc(xx + step / 2, yy + step / 2, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawGrain(ctx, w, h, seed) {
  let s = seed;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  ctx.save();
  ctx.globalAlpha = 0.07;
  for (let i = 0; i < Math.round((w * h) / 900); i++) {
    const v = rnd() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(rnd() * w, rnd() * h, 1.6, 1.6);
  }
  ctx.restore();
}

function drawStars(ctx, cx, y, n, size, color) {
  ctx.save();
  ctx.font = `${size}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const label = '★'.repeat(n) + '☆'.repeat(Math.max(0, 5 - n));
  const tw = ctx.measureText(label).width;
  ctx.fillStyle = 'rgba(8,2,14,0.65)';
  const pad = size * 0.45;
  ctx.beginPath();
  ctx.roundRect(cx - tw / 2 - pad, y - size * 0.75, tw + pad * 2, size * 1.5, size * 0.75);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.fillText(label, cx, y);
  ctx.restore();
}

function drawBadge(ctx, text, x, y, size, grade) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.06);
  ctx.font = `bold ${size}px Anton, sans-serif`;
  const tw = ctx.measureText(text).width + size * 1.1;
  ctx.fillStyle = grade.glow;
  ctx.fillRect(-tw / 2, -size * 0.75, tw, size * 1.5);
  ctx.fillStyle = '#14060f';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, size * 0.05);
  ctx.restore();
}

// Draws the whole cover. `photos` is an array of loaded images (or nulls).
// Returns the panel rectangles in canvas pixels, for click-to-select.
export function drawCover(canvas, photos, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const rects = layoutPanels(state.layout, w, h);
  const titleTop = h * 0.79;
  const titleH = h - titleTop;

  ctx.fillStyle = '#12081f';
  ctx.fillRect(0, 0, w, h);

  const count = (LAYOUTS[state.layout] || LAYOUTS.grid9).panels;
  const tilted = state.layout === 'tilted';
  if (tilted) {
    const bg = photos[state.panels[0].photo] || photos[0];
    if (bg) {
      drawPhotoInto(ctx, bg, { x: 0, y: 0, w, h: titleTop }, { zoom: 1.05, ox: 0, oy: 0.08 });
      ctx.fillStyle = 'rgba(10,4,20,0.62)';
      ctx.fillRect(0, 0, w, titleTop);
    }
  }

  for (let i = tilted ? 1 : 0; i < count; i++) {
    const rect = rects[i];
    const panel = state.panels[i] || { photo: 0, zoom: 1, ox: 0, oy: 0 };
    const img = photos[panel.photo] || null;
    if (rect.snap) {
      ctx.save();
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate(rect.rot);
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = w * 0.02;
      ctx.shadowOffsetY = h * 0.012;
      ctx.fillStyle = '#fdf8ef';
      const bw = Math.max(8, w * 0.008);
      ctx.fillRect(-rect.w / 2 - bw, -rect.h / 2 - bw, rect.w + bw * 2, rect.h + bw * 2 + bw * 2.4);
      ctx.restore();
      ctx.save();
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate(rect.rot);
      ctx.beginPath();
      ctx.rect(-rect.w / 2, -rect.h / 2, rect.w, rect.h);
      ctx.clip();
      if (img) {
        const iw = img.naturalWidth || img.width;
        const ih = img.naturalHeight || img.height;
        const scale = Math.max(rect.w / iw, rect.h / ih) * (panel.zoom || 1);
        ctx.drawImage(img, -iw * scale / 2 + (panel.ox || 0) * rect.w, -ih * scale / 2 + (panel.oy || 0) * rect.h, iw * scale, ih * scale);
      }
      ctx.restore();
    } else {
      if (img) drawPhotoInto(ctx, img, rect, panel);
      else {
        ctx.fillStyle = '#2b1538';
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      }
      if (state.frame) {
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = Math.max(2, w * 0.002);
        ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
      }
    }
  }

  // Sunset / neon grade wash over the panels.
  const wash = ctx.createLinearGradient(0, 0, 0, titleTop);
  wash.addColorStop(0, grade.top);
  wash.addColorStop(1, grade.bottom);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, titleTop);

  // Vignette.
  const vig = ctx.createRadialGradient(w / 2, titleTop / 2, Math.min(w, titleTop) * 0.35, w / 2, titleTop / 2, Math.max(w, titleTop) * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, titleTop);

  // Title band: black scrim, halftone corners, big Anton title.
  const scrim = ctx.createLinearGradient(0, titleTop - h * 0.06, 0, h);
  scrim.addColorStop(0, 'rgba(8,2,14,0)');
  scrim.addColorStop(0.25, 'rgba(8,2,14,0.92)');
  scrim.addColorStop(1, 'rgba(8,2,14,1)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, titleTop - h * 0.06, w, titleH + h * 0.06);

  if (state.halftone) {
    drawHalftone(ctx, w * 0.015, titleTop + titleH * 0.12, w * 0.07, titleH * 0.7, 'rgba(255,122,26,0.5)');
    drawHalftone(ctx, w * 0.915, titleTop + titleH * 0.12, w * 0.07, titleH * 0.7, 'rgba(255,0,153,0.5)');
  }

  const title = (state.title || '').trim().toUpperCase();
  if (title) {
    const size = fitFont(ctx, title, w * 0.82, titleH * 0.52, 'Anton, sans-serif');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const ty = titleTop + titleH * 0.42;
    ctx.lineJoin = 'round';
    ctx.lineWidth = size * 0.09;
    ctx.strokeStyle = '#14060f';
    ctx.strokeText(title, w / 2, ty);
    const fill = ctx.createLinearGradient(0, ty - size * 0.5, 0, ty + size * 0.5);
    fill.addColorStop(0, '#fff7e8');
    fill.addColorStop(0.55, '#ffd166');
    fill.addColorStop(1, grade.glow);
    ctx.fillStyle = fill;
    ctx.fillText(title, w / 2, ty);
  }

  const sub = (state.subtitle || '').trim();
  if (sub) {
    const size = fitFont(ctx, sub, w * 0.7, titleH * 0.17, 'Pacifico, cursive');
    ctx.font = `${size}px Pacifico, cursive`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = grade.glow;
    ctx.shadowColor = grade.glow;
    ctx.shadowBlur = size * 0.5;
    ctx.fillText(sub, w / 2, titleTop + titleH * 0.86);
    ctx.shadowBlur = 0;
  }

  if (state.badge) {
    drawBadge(ctx, state.badge.trim().toUpperCase(), w * 0.11, h * 0.055, Math.max(14, h * 0.026), grade);
  }
  drawStars(ctx, w * 0.89, h * 0.055, state.stars || 0, Math.max(16, h * 0.03), '#ffd166');

  if (state.grain) drawGrain(ctx, w, h, 1234567);

  return rects.map((r) => ({ x: r.x, y: r.y, w: r.w, h: r.h }));
}

// Renders the cover at export size and returns a PNG blob.
export function exportCover(photos, state, sizeKey) {
  const size = SIZES[sizeKey] || SIZES.square;
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  drawCover(off, photos, state);
  return new Promise((resolve) => off.toBlob(resolve, 'image/png'));
}
