// Neon Boulevard Press: the cover painter.
//
// renderCover draws the whole cover on a canvas, at any size, from the
// cover state and the loaded photos. The preview and the exported PNG run
// this same code, so the two always match.
//
// Everything flows through one job object so the small painters below
// never have to look up the layout or the grade twice.

import { findLayout, findGrade, findSize } from "./catalog.js";

// Xorshift stream. Fixed seeds keep the skyline and the grain identical
// on every draw.
function xorshift(seed) {
  let s = seed >>> 0 || 1;
  return function () {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

function clampNum(v, lo, hi) {
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}

// Panel rect in unit coords to pixels.
function pxRect(panel, W, H) {
  return [panel[0] * W, panel[1] * H, panel[2] * W, panel[3] * H, panel[4] || 0];
}

// Cover fit for a photo inside a panel, then zoom and pan. Returns the
// drawImage box. Zoom is anchored on the panel center, pan moves the
// photo in fractions of the panel size.
function photoBox(img, pw, ph, slot) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const imgAspect = iw / ih;
  const panelAspect = pw / ph;
  let dw;
  let dh;
  if (imgAspect > panelAspect) {
    dh = ph;
    dw = ph * imgAspect;
  } else {
    dw = pw;
    dh = pw / imgAspect;
  }
  dw *= slot.zoom;
  dh *= slot.zoom;
  const oxRange = Math.max(0, (dw - pw) / 2);
  const oyRange = Math.max(0, (dh - ph) / 2);
  const ox = clampNum(slot.ox * pw, -oxRange, oxRange);
  const oy = clampNum(slot.oy * ph, -oyRange, oyRange);
  return [(pw - dw) / 2 + ox, (ph - dh) / 2 + oy, dw, dh];
}

function paintPhoto(job, px, py, pw, ph, slot) {
  const { ctx, grade } = job;
  const photo = job.cover.photos[slot.photo] || job.cover.photos[0];
  const img = photo ? job.photos.get(photo.id) : null;
  if (!img) {
    ctx.fillStyle = "#3a3049";
    ctx.fillRect(px, py, pw, ph);
    return;
  }
  const [dx, dy, dw, dh] = photoBox(img, pw, ph, slot);
  ctx.save();
  ctx.beginPath();
  ctx.rect(px, py, pw, ph);
  ctx.clip();
  ctx.filter = grade.filter;
  ctx.drawImage(img, px + dx, py + dy, dw, dh);
  ctx.filter = "none";
  const [top, bottom, blend, amount] = grade.tint;
  const wash = ctx.createLinearGradient(px, py, px, py + ph);
  wash.addColorStop(0, top);
  wash.addColorStop(1, bottom);
  ctx.globalCompositeOperation = blend;
  ctx.globalAlpha = amount;
  ctx.fillStyle = wash;
  ctx.fillRect(px, py, pw, ph);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.fillStyle = grade.veil;
  ctx.fillRect(px, py, pw, ph);
  ctx.restore();
}

function paintFrame(job, px, py, pw, ph) {
  const { ctx, W } = job;
  const lw = Math.max(2, W * 0.004);
  ctx.save();
  ctx.lineWidth = lw;
  ctx.strokeStyle = "rgba(255,255,255,0.92)";
  ctx.strokeRect(px + lw / 2, py + lw / 2, pw - lw, ph - lw);
  ctx.restore();
}

// One palm silhouette. The trunk is a curve, each frond a tapered blade
// built from a quadratic spine with a width that shrinks to the tip.
function paintPalm(job, bx, by, len, dir) {
  const { ctx } = job;
  const topX = bx + dir * len * 0.24;
  const topY = by - len;
  ctx.save();
  ctx.strokeStyle = "#160a2b";
  ctx.fillStyle = "#160a2b";
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(4, len * 0.03);
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.quadraticCurveTo(bx + dir * len * 0.1, by - len * 0.55, topX, topY);
  ctx.stroke();
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * 0.42;
    const tipX = topX + Math.cos(a) * len * 0.44;
    const tipY = topY + Math.sin(a) * len * 0.44 + len * 0.2;
    const midX = topX + Math.cos(a) * len * 0.2;
    const midY = topY + Math.sin(a) * len * 0.2 + len * 0.1;
    const steps = 7;
    const left = [];
    const right = [];
    for (let k = 0; k <= steps; k++) {
      const t = k / steps;
      const x = (1 - t) * (1 - t) * topX + 2 * (1 - t) * t * midX + t * t * tipX;
      const y = (1 - t) * (1 - t) * topY + 2 * (1 - t) * t * midY + t * t * tipY;
      const dx = 2 * (1 - t) * (midX - topX) + 2 * t * (tipX - midX);
      const dy = 2 * (1 - t) * (midY - topY) + 2 * t * (tipY - midY);
      const n = Math.hypot(dx, dy) || 1;
      const w = (8 * (1 - t) + 1) * Math.max(1, len / 300);
      left.push([x - (dy / n) * w, y + (dx / n) * w]);
      right.push([x + (dy / n) * w, y - (dx / n) * w]);
    }
    ctx.beginPath();
    ctx.moveTo(left[0][0], left[0][1]);
    for (const p of left) ctx.lineTo(p[0], p[1]);
    for (let k = right.length - 1; k >= 0; k--) ctx.lineTo(right[k][0], right[k][1]);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// Painted sunset sky for the postcard layout: gradient, sun, skyline, and
// two palm silhouettes. All drawn in code, no photo needed.
function paintSky(job) {
  const { ctx, W, H } = job;
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#33135e");
  sky.addColorStop(0.38, "#e0218a");
  sky.addColorStop(0.68, "#ff7a2f");
  sky.addColorStop(1, "#ffd319");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  const sunX = W * 0.28;
  const sunY = H * 0.32;
  const sunR = W * 0.075;
  const halo = ctx.createRadialGradient(sunX, sunY, sunR * 0.3, sunX, sunY, sunR * 2.8);
  halo.addColorStop(0, "rgba(255,240,190,0.9)");
  halo.addColorStop(1, "rgba(255,240,190,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#fff3c4";
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();

  const next = xorshift(4242);
  const base = H;
  let x = -W * 0.02;
  while (x < W) {
    const bw = W * (0.05 + next() * 0.1);
    const bh = H * (0.08 + next() * 0.18);
    ctx.fillStyle = "#1c0b33";
    ctx.fillRect(x, base - bh, bw, bh);
    ctx.fillStyle = "rgba(255,211,25,0.8)";
    const lit = 2 + Math.floor(next() * 4);
    for (let k = 0; k < lit; k++) {
      ctx.fillRect(x + bw * (0.12 + next() * 0.68), base - bh + bh * (0.12 + next() * 0.66), 3, 4);
    }
    x += bw + W * 0.014;
  }
  paintPalm(job, W * 0.07, H * 0.99, H * 0.3, -1);
  paintPalm(job, W * 0.93, H * 0.99, H * 0.34, 1);
}

// The title block. Lines are wrapped greedily to the zone width, then
// the font size is found by binary search so the block fits the zone.
function paintTitle(job, zx, zy, zw, zh) {
  const { ctx, cover } = job;
  const family = `"Arial Narrow", "Liberation Sans Narrow", Impact, "Helvetica Neue", sans-serif`;
  const raw = (cover.title || "UNTITLED").toUpperCase();
  const sub = cover.subtitle || "";
  const squeeze = 0.85;
  const setFont = (px) => {
    ctx.font = `900 ${px}px ${family}`;
  };
  const wrap = (px) => {
    setFont(px);
    const words = raw.split(" ");
    const lines = [];
    let cur = "";
    for (const w of words) {
      const test = cur ? `${cur} ${w}` : w;
      if (ctx.measureText(test).width * squeeze <= zw * 0.96 || !cur) {
        cur = test;
      } else {
        lines.push(cur);
        cur = w;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  };
  const fits = (px) => {
    const lines = wrap(px);
    if (lines.length > 3) return false;
    const block = px * 1.08 * lines.length + (sub ? px * 0.55 : 0);
    if (block > zh * 0.92) return false;
    return lines.every((ln) => ctx.measureText(ln).width * squeeze <= zw * 0.96);
  };
  let lo = 10;
  let hi = Math.min(zh * 0.62, 400);
  let px = lo;
  for (let i = 0; i < 14; i++) {
    const mid = (lo + hi) / 2;
    if (fits(mid)) {
      px = mid;
      lo = mid;
    } else {
      hi = mid;
    }
  }
  const lines = wrap(px);
  const cx = zx + zw / 2;
  const blockH = px * 1.08 * lines.length + (sub ? px * 0.55 : 0);
  const yTop = zy + (zh - blockH) / 2;

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if ("letterSpacing" in ctx) ctx.letterSpacing = `${Math.max(1, px * 0.02)}px`;
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = px * 0.08;
  ctx.shadowOffsetY = px * 0.03;
  ctx.lineJoin = "round";
  setFont(px);
  ctx.lineWidth = px * (cover.titleStyle === "outline" ? 0.045 : 0.06);
  ctx.strokeStyle = cover.titleStyle === "outline" ? "#ffffff" : "#14060f";
  lines.forEach((ln, i) => {
    const cy = yTop + px * 1.08 * (i + 0.5);
    let fill;
    if (cover.titleStyle === "solid") fill = "#ffffff";
    else if (cover.titleStyle === "outline") fill = "#1a0b26";
    else {
      const g = ctx.createLinearGradient(cx - zw / 2, cy - px / 2, cx - zw / 2, cy + px / 2);
      g.addColorStop(0, "#ffd319");
      g.addColorStop(0.5, "#ff2975");
      g.addColorStop(1, "#8c1eff");
      fill = g;
    }
    ctx.save();
    ctx.translate(cx, 0);
    ctx.scale(squeeze, 1);
    ctx.strokeText(ln, 0, cy);
    ctx.fillStyle = fill;
    ctx.fillText(ln, 0, cy);
    ctx.restore();
  });
  ctx.restore();
  if (sub) {
    const subPx = Math.max(10, px * 0.34);
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `italic 700 ${subPx}px Georgia, "Times New Roman", serif`;
    ctx.fillStyle = "#ffe9f2";
    ctx.fillText(sub, cx, yTop + px * 1.08 * lines.length + px * 0.55 * 0.6);
    ctx.restore();
  }
}

function paintDots(job, zx, zy, zw, zh) {
  const { ctx, W } = job;
  const step = Math.max(10, W * 0.022);
  ctx.save();
  ctx.beginPath();
  ctx.rect(zx, zy, zw, zh);
  ctx.clip();
  ctx.fillStyle = "rgba(255,255,255,0.10)";
  let row = 0;
  for (let y = zy + step / 2; y < zy + zh; y += step, row++) {
    const off = row % 2 ? step / 2 : 0;
    for (let x = zx + step / 2 + off; x < zx + zw; x += step) {
      ctx.beginPath();
      ctx.arc(x, y, Math.max(1.5, step * 0.14), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// Badge ribbon: a yellow tag with a notched tail, tilted a touch.
function paintBadge(job) {
  const { ctx, cover, W, H } = job;
  const text = (cover.badge || "").trim();
  if (!text) return;
  const px = Math.max(13, W * 0.022);
  ctx.save();
  ctx.font = `900 ${px}px "Arial Narrow", "Liberation Sans Narrow", Impact, sans-serif`;
  const tw = ctx.measureText(text).width;
  const bw = tw + px * 2.2;
  const bh = px * 1.9;
  ctx.translate(W - bw - W * 0.02, H * 0.025);
  ctx.rotate(-0.06);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(bw, 0);
  ctx.lineTo(bw, bh);
  ctx.lineTo(0, bh);
  ctx.lineTo(px * 0.7, bh / 2);
  ctx.closePath();
  ctx.fillStyle = "#ffd319";
  ctx.fill();
  ctx.strokeStyle = "#14060f";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#14060f";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, bw / 2 + px * 0.3, bh / 2 + 1);
  ctx.restore();
}

// Grain from a small noise tile, repeated across the cover. The tile is
// built once and cached on the job so every draw uses the same grain.
function paintGrain(job) {
  const { ctx, W, H } = job;
  if (!job.grainTile) {
    const tile = document.createElement("canvas");
    tile.width = 128;
    tile.height = 128;
    const tctx = tile.getContext("2d");
    const next = xorshift(20261119);
    for (let i = 0; i < 2600; i++) {
      const v = next();
      tctx.fillStyle = v > 0.5 ? `rgba(255,255,255,${0.05 + next() * 0.06})` : `rgba(0,0,0,${0.05 + next() * 0.06})`;
      tctx.fillRect(next() * 128, next() * 128, 1 + next() * 1.5, 1 + next() * 1.5);
    }
    job.grainTile = ctx.createPattern(tile, "repeat");
  }
  ctx.save();
  ctx.fillStyle = job.grainTile;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function paintShade(job) {
  const { ctx, W, H } = job;
  const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.72);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.3)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function paintTitleZone(job) {
  const { ctx, cover, W, H } = job;
  const [kind, txr, tyr, twr, thr] = findLayout(cover.layout).title;
  const tx = txr * W;
  const ty = tyr * H;
  const tw = twr * W;
  const th = thr * H;
  if (kind === "cell") {
    ctx.fillStyle = "#1b0f2e";
    ctx.fillRect(tx, ty, tw, th);
    ctx.strokeStyle = "#ffd319";
    ctx.lineWidth = Math.max(2, W * 0.003);
    ctx.strokeRect(tx + 1, ty + 1, tw - 2, th - 2);
    if (cover.halftone) paintDots(job, tx, ty, tw, th);
    paintTitle(job, tx, ty, tw, th);
  } else if (kind === "band") {
    ctx.fillStyle = "rgba(10,6,16,0.88)";
    ctx.fillRect(tx, ty, tw, th);
    ctx.fillStyle = "#ff2975";
    ctx.fillRect(tx, ty, tw, Math.max(3, H * 0.006));
    if (cover.halftone) paintDots(job, tx, ty, tw, th);
    paintTitle(job, tx, ty, tw, th);
  } else if (kind === "scrim") {
    const scrim = ctx.createLinearGradient(0, ty, 0, ty + th);
    scrim.addColorStop(0, "rgba(5,2,10,0)");
    scrim.addColorStop(1, "rgba(5,2,10,0.85)");
    ctx.fillStyle = scrim;
    ctx.fillRect(tx, ty, tw, th);
    paintTitle(job, tx, ty, tw, th);
  } else {
    paintTitle(job, tx, ty, tw, th);
  }
}

function paintPanels(job) {
  const { ctx, cover, W, H, layout } = job;
  layout.panels.forEach((panel, i) => {
    const [px, py, pw, ph, tilt] = pxRect(panel, W, H);
    const slot = job.slots[i] || { photo: 0, zoom: 1, ox: 0, oy: 0 };
    const photo = cover.photos[slot.photo] || cover.photos[0];
    ctx.save();
    if (panel.length > 4) {
      ctx.translate(px + pw / 2, py + ph / 2);
      ctx.rotate((tilt * Math.PI) / 180);
      ctx.translate(-pw / 2, -ph / 2);
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = W * 0.02;
      ctx.shadowOffsetY = H * 0.008;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(-pw * 0.04, -ph * 0.04, pw * 1.08, ph * 1.16);
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      paintPhoto(job, 0, 0, pw, ph, slot);
      ctx.fillStyle = "#241a2e";
      ctx.font = `italic 700 ${Math.max(12, pw * 0.045)}px Georgia, serif`;
      ctx.textAlign = "center";
      ctx.fillText(photo ? photo.name : "", pw / 2, ph * 1.09);
      ctx.restore();
      return;
    }
    paintPhoto(job, px, py, pw, ph, slot);
    if (cover.frame) paintFrame(job, px, py, pw, ph);
    ctx.restore();
  });
}

// Which panel sits under a point in cover pixels, for clicks and drags.
export function panelAt(cover, x, y, W, H) {
  const layout = findLayout(cover.layout);
  for (let i = layout.panels.length - 1; i >= 0; i--) {
    const [px, py, pw, ph, tilt] = pxRect(layout.panels[i], W, H);
    if (layout.panels[i].length <= 4) {
      if (x >= px && x <= px + pw && y >= py && y <= py + ph) return i;
      continue;
    }
    const cx = px + pw / 2;
    const cy = py + ph / 2;
    const a = (-tilt * Math.PI) / 180;
    const dx = x - cx;
    const dy = y - cy;
    const lx = dx * Math.cos(a) - dy * Math.sin(a);
    const ly = dx * Math.sin(a) + dy * Math.cos(a);
    if (Math.abs(lx) <= pw / 2 && Math.abs(ly) <= ph / 2) return i;
  }
  return -1;
}

export function renderCover(canvas, cover, photos) {
  const size = findSize(cover.size);
  const W = size.w;
  const H = size.h;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  const job = {
    ctx,
    cover,
    photos,
    W,
    H,
    layout: findLayout(cover.layout),
    grade: findGrade(cover.grade),
    slots: cover.slots[cover.layout] || [],
    grainTile: null,
  };
  ctx.fillStyle = "#0c0a10";
  ctx.fillRect(0, 0, W, H);
  if (job.layout.bg === "sky") paintSky(job);
  paintPanels(job);
  paintTitleZone(job);
  paintBadge(job);
  if (cover.grain) paintGrain(job);
  if (cover.vignette) paintShade(job);
}
