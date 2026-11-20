// Vice Lights Press: the cover engine.
// Draws GTA-poster-style multi-panel cover art onto a 2D canvas: panels inked
// and banded as poster art, a Vice City neon-sunset grade, and a bold title
// block. Pure canvas, no network, deterministic (seeded grain).

/** A tiny deterministic PRNG so exports are stable run to run. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const LAYOUTS = [
  { id: 'hero3', name: 'Hero + 3' },
  { id: 'grid4', name: 'Four Grid' },
  { id: 'grid9', name: 'Nine Grid' },
  { id: 'fullbleed', name: 'Full Bleed' },
  { id: 'tilted', name: 'Tilted Snaps' },
  { id: 'strip', name: 'Story Strip' },
];

export const GRADES = [
  { id: 'sunset', name: 'Vice Sunset', sky: ['#ff7e3d', '#e53888'], wash: 'rgba(255,110,60,0.20)', deep: '#2b1040' },
  { id: 'neon', name: 'Neon Pink', sky: ['#ff2d96', '#2de2e6'], wash: 'rgba(255,45,150,0.16)', deep: '#0d0d24' },
  { id: 'golden', name: 'Golden Hour', sky: ['#ffb347', '#ff7b2f'], wash: 'rgba(255,180,70,0.20)', deep: '#3a1c07' },
  { id: 'noir', name: 'Midnight Noir', sky: ['#3b2d8f', '#0e0a2a'], wash: 'rgba(70,60,180,0.22)', deep: '#070512' },
  { id: 'palm', name: 'Palm Fade', sky: ['#2fd4a7', '#0e7d8a'], wash: 'rgba(47,212,167,0.14)', deep: '#06231f' },
  { id: 'mono', name: 'Mono Noir', sky: ['#d8d8d8', '#5a5a5a'], wash: 'rgba(255,255,255,0.10)', deep: '#111111' },
];

export const TITLE_STYLES = [
  { id: 'halftone', name: 'Halftone Block' },
  { id: 'band', name: 'Outline Band' },
  { id: 'script', name: 'Neon Script' },
];

export const SIZES = [
  { id: '1080x1350', w: 1080, h: 1350, name: 'Portrait 4:5' },
  { id: '1080x1080', w: 1080, h: 1080, name: 'Square 1:1' },
  { id: '1920x1080', w: 1920, h: 1080, name: 'Wide 16:9' },
];

/** Panel rectangles for a layout, as fractions of the art area (x, y, w, h, rot). */
export function panelRects(layout, count) {
  const R = (x, y, w, h, rot = 0) => ({ x, y, w, h, rot });
  switch (layout) {
    case 'hero3':
      return [R(0, 0, 1, 0.62), R(0, 0.62, 0.333, 0.38), R(0.333, 0.62, 0.334, 0.38), R(0.667, 0.62, 0.333, 0.38)];
    case 'grid4':
      return [R(0, 0, 0.5, 0.5), R(0.5, 0, 0.5, 0.5), R(0, 0.5, 0.5, 0.5), R(0.5, 0.5, 0.5, 0.5)];
    case 'grid9': {
      const out = [];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) out.push(R(c / 3, r / 3, 1 / 3, 1 / 3));
      return out;
    }
    case 'fullbleed':
      return [R(0, 0, 1, 1)];
    case 'tilted':
      return [R(0.02, 0.06, 0.44, 0.8, -0.10), R(0.30, 0.02, 0.44, 0.82, 0.03), R(0.56, 0.08, 0.42, 0.78, 0.10)];
    case 'strip':
      return [R(0, 0, 1, 0.36), R(0, 0.36, 1, 0.32), R(0, 0.68, 1, 0.32)];
    default:
      return [R(0, 0, 1, 1)];
  }
}

/** Draw one photo cover-fit into a rect, with zoom and pan offsets. */
export function drawPhotoCover(ctx, img, x, y, w, h, zoom = 1, ox = 0, oy = 0) {
  if (!img || !img.naturalWidth) return;
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
  const pw = img.naturalWidth * scale;
  const ph = img.naturalHeight * scale;
  const dx = x + (w - pw) / 2 + ox * w * 0.25;
  const dy = y + (h - ph) / 2 + oy * h * 0.25;
  ctx.drawImage(img, dx, dy, pw, ph);
}

/** The grade wash: a sunset gradient + tint over the art area, clipped. */
export function applyGrade(ctx, grade, x, y, w, h) {
  const g = GRADES.find((v) => v.id === grade) ?? GRADES[0];
  if (grade === 'mono') {
    ctx.save();
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = '#808080';
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }
  const tint = ctx.createLinearGradient(x, y, x + w * 0.25, y + h);
  tint.addColorStop(0, g.sky[0] + '00');
  tint.addColorStop(0.55, g.wash);
  tint.addColorStop(1, g.sky[1] + '55');
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = tint;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = g.sky[0];
  ctx.globalAlpha = 0.18;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

/** Halftone dots across a band. */
export function halftone(ctx, x, y, w, h, color, gap, maxR, seed) {
  const rnd = mulberry32(seed);
  ctx.fillStyle = color;
  for (let yy = y + gap / 2; yy < y + h; yy += gap) {
    for (let xx = x + gap / 2; xx < x + w; xx += gap) {
      const r = maxR * (0.35 + 0.65 * rnd());
      ctx.beginPath();
      ctx.arc(xx, yy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** Bold condensed caps text, fitted to a max width. Returns the font size used. */
export function drawTitleText(ctx, text, cx, cy, maxW, size, color, glow = null) {
  const words = (text || 'VICE LIGHTS').trim().toUpperCase();
  let s = size;
  const set = () => { ctx.font = `700 ${s}px "Vice Sans", "Liberation Sans", sans-serif`; };
  set();
  const measure = () => ctx.measureText(words).width * 0.84;
  while (measure() > maxW && s > 12) { s -= 2; set(); }
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(0.84, 1);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (glow) {
    ctx.shadowColor = glow;
    ctx.shadowBlur = s * 0.35;
  }
  ctx.fillStyle = color;
  ctx.fillText(words, 0, 0);
  ctx.restore();
  return s;
}

/** The title band at the foot of the cover. Returns nothing; draws in place. */
export function drawTitleBand(ctx, art, W, H, grade) {
  const g = GRADES.find((v) => v.id === grade) ?? GRADES[0];
  const bandH = H * 0.22;
  const bandY = H - bandH;
  const seed = art.caption.length * 31 + art.layout.length * 7;
  if (art.titleStyle === 'halftone') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, bandY, W, bandH);
    halftone(ctx, 0, bandY, W, bandH * 0.28, g.sky[0], Math.max(10, W * 0.014), Math.max(2, W * 0.004), seed);
    ctx.fillStyle = g.deep;
    ctx.fillRect(0, bandY, W, Math.max(4, H * 0.006));
    drawTitleText(ctx, art.caption, W / 2, bandY + bandH * 0.42, W * 0.92, bandH * 0.42, g.deep);
    ctx.font = `700 ${Math.max(12, bandH * 0.11)}px "Vice Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = g.sky[1];
    ctx.fillText((art.subtitle || 'LEONIDA').toUpperCase(), W / 2, bandY + bandH * 0.78);
    drawHeat(ctx, art.heat, W - W * 0.09, bandY + bandH * 0.82, Math.max(10, bandH * 0.09), g.sky[0]);
  } else if (art.titleStyle === 'band') {
    ctx.fillStyle = '#0b0b12';
    ctx.fillRect(0, bandY, W, bandH);
    ctx.save();
    ctx.translate(0, bandY);
    ctx.rotate(-0.03);
    ctx.fillStyle = g.sky[0];
    ctx.fillRect(-W * 0.05, bandH * 0.08, W * 1.1, bandH * 0.10);
    ctx.restore();
    const s = drawTitleText(ctx, art.caption, W / 2, bandY + bandH * 0.44, W * 0.92, bandH * 0.42, '#ffffff');
    ctx.save();
    ctx.translate(W / 2, bandY + bandH * 0.44);
    ctx.scale(0.84, 1);
    ctx.font = `700 ${s}px "Vice Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = Math.max(2, s * 0.06);
    ctx.strokeStyle = g.sky[1];
    ctx.strokeText((art.caption || 'VICE LIGHTS').trim().toUpperCase(), 0, 0);
    ctx.restore();
    ctx.font = `italic 700 ${Math.max(12, bandH * 0.12)}px "Vice Serif", serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = g.sky[0];
    ctx.fillText((art.subtitle || 'Leonida after dark').toUpperCase(), W / 2, bandY + bandH * 0.80);
    drawHeat(ctx, art.heat, W - W * 0.09, bandY + bandH * 0.82, Math.max(10, bandH * 0.09), g.sky[0]);
  } else { // script: title floats over the art, neon glow, no band
    ctx.font = `italic 700 ${Math.max(16, H * 0.022)}px "Vice Serif", serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = g.sky[0];
    ctx.shadowBlur = H * 0.012;
    ctx.fillText((art.subtitle || 'Leonida after dark'), W / 2, H - bandH * 0.78);
    ctx.shadowBlur = 0;
    drawTitleText(ctx, art.caption, W / 2, H - bandH * 0.34, W * 0.94, bandH * 0.52, '#ffffff', g.sky[0]);
    drawHeat(ctx, art.heat, W - W * 0.09, H - bandH * 0.08, Math.max(10, bandH * 0.09), g.sky[0]);
  }
}

/** Five-star heat meter; filled stars = heat. */
export function drawHeat(ctx, heat, cx, cy, r, color) {
  const n = Math.max(0, Math.min(5, heat || 0));
  ctx.save();
  ctx.translate(cx - r * 5, cy);
  for (let i = 0; i < 5; i++) {
    const x = i * r * 2;
    ctx.beginPath();
    for (let k = 0; k < 10; k++) {
      const ang = -Math.PI / 2 + (k * Math.PI) / 5;
      const rad = k % 2 === 0 ? r : r * 0.45;
      const px = x + Math.cos(ang) * rad;
      const py = Math.sin(ang) * rad;
      if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = i < n ? color : 'rgba(255,255,255,0.25)';
    ctx.fill();
  }
  ctx.restore();
}

/** A corner badge tab pinned inside the top-right of the cover. */
export function drawBadge(ctx, text, W, grade) {
  if (!text) return;
  const g = GRADES.find((v) => v.id === grade) ?? GRADES[0];
  const label = text.trim().toUpperCase().slice(0, 14);
  const m = Math.max(8, W * 0.012);
  const bh = Math.max(22, W * 0.045);
  ctx.save();
  ctx.font = `700 ${bh * 0.44}px "Vice Sans", sans-serif`;
  const tw = ctx.measureText(label).width;
  const bw = Math.min(W * 0.3, tw + bh * 1.6);
  const x1 = W - m;
  const x0 = x1 - bw;
  const slant = bh * 0.55;
  ctx.fillStyle = g.sky[0];
  ctx.beginPath();
  ctx.moveTo(x0 + slant, m);
  ctx.lineTo(x1, m);
  ctx.lineTo(x1 - slant, m + bh);
  ctx.lineTo(x0, m + bh);
  ctx.closePath();
  ctx.fill();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(label, (x0 + x1) / 2, m + bh * 0.54);
  ctx.restore();
}

/** Film grain + vignette over the whole cover. Deterministic per caption. */
export function finishCover(ctx, W, H, seed) {
  const rnd = mulberry32(seed);
  ctx.save();
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < Math.floor((W * H) / 900); i++) {
    ctx.fillStyle = rnd() > 0.5 ? '#ffffff' : '#000000';
    ctx.fillRect(rnd() * W, rnd() * H, 1.5, 1.5);
  }
  ctx.restore();
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.32)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
}

/**
 * Draw the whole cover. `art` carries layout, grade, titleStyle, caption,
 * subtitle, badge, heat, and photos: [{img, zoom, ox, oy}] plus
 * panelPhoto: [photo index per panel]. The art area is the top 78% of the
 * canvas; the title band takes the foot (except `script`, which floats).
 */
export function drawCoverArt(ctx, art, W, H) {
  const grade = GRADES.find((v) => v.id === art.grade) ?? GRADES[0];
  ctx.fillStyle = grade.deep;
  ctx.fillRect(0, 0, W, H);
  const artH = art.titleStyle === 'script' ? H : H * 0.78;
  const rects = panelRects(art.layout, art.photos.length);
  const m = Math.max(6, W * 0.012); // gutter
  const seed = (art.caption || '').length * 131 + art.layout.length * 17;
  rects.forEach((r, i) => {
    const px = r.x * W + m;
    const py = r.y * artH + m;
    const pw = r.w * W - m * 2;
    const ph = r.h * artH - m * 2;
    if (pw <= 0 || ph <= 0) return;
    const photo = art.photos[(art.panelPhoto && art.panelPhoto[i]) ?? (i % Math.max(1, art.photos.length))] ?? art.photos[0];
    ctx.save();
    if (r.rot) {
      ctx.translate(px + pw / 2, py + ph / 2);
      ctx.rotate(r.rot);
      ctx.translate(-pw / 2, -ph / 2);
    } else {
      ctx.translate(px, py);
    }
    ctx.beginPath();
    ctx.rect(0, 0, pw, ph);
    ctx.clip();
    if (photo && photo.img) {
      if (art.grade === 'mono') ctx.filter = 'grayscale(1) contrast(1.12)';
      drawPhotoCover(ctx, photo.img, 0, 0, pw, ph, photo.zoom ?? 1, photo.ox ?? 0, photo.oy ?? 0);
      ctx.filter = 'none';
    } else {
      const g2 = ctx.createLinearGradient(0, 0, pw, ph);
      g2.addColorStop(0, grade.sky[0]);
      g2.addColorStop(1, grade.sky[1]);
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, pw, ph);
    }
    applyGrade(ctx, art.grade, 0, 0, pw, ph);
    ctx.restore();
    // inked frame: white gutter line + dark outline
    ctx.save();
    if (r.rot) {
      ctx.translate(px + pw / 2, py + ph / 2);
      ctx.rotate(r.rot);
      ctx.translate(-pw / 2, -ph / 2);
    } else {
      ctx.translate(px, py);
    }
    ctx.lineWidth = Math.max(2, W * 0.004);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(0, 0, pw, ph);
    ctx.lineWidth = Math.max(1, W * 0.002);
    ctx.strokeStyle = 'rgba(0,0,0,0.65)';
    ctx.strokeRect(Math.max(2, W * 0.004), Math.max(2, W * 0.004), pw - Math.max(4, W * 0.008), ph - Math.max(4, W * 0.008));
    ctx.restore();
  });
  if (art.titleStyle === 'script') {
    // darken the foot so the floating title reads
    const sh = ctx.createLinearGradient(0, H * 0.62, 0, H);
    sh.addColorStop(0, 'rgba(0,0,0,0)');
    sh.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = sh;
    ctx.fillRect(0, H * 0.62, W, H * 0.38);
  }
  drawTitleBand(ctx, art, W, H, art.grade);
  drawBadge(ctx, art.badge, W, art.grade);
  finishCover(ctx, W, H, seed);
}
