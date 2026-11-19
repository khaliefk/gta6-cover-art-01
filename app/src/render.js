// Neon Boulevard Press: the painter.
//
// One function draws a whole cover onto any canvas, preview or export.
// The preview and the PNG share this path, so what you see is what
// the file holds. Panels are clipped to their rect, photos cover the
// rect with a zoom and a pan, then the grade, the title block, and the
// texture layers go on top in that order.

import { GRADES, LAYOUTS } from "./state.js";

const FONT = `"Arial Black", "Helvetica Neue", Arial, sans-serif`;

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawCoverPhoto(ctx, img, rx, ry, rw, rh, panel) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const base = Math.max(rw / iw, rh / ih) * panel.zoom;
  const dw = iw * base;
  const dh = ih * base;
  const dx = rx + (rw - dw) / 2 + panel.x * rw;
  const dy = ry + (rh - dh) / 2 + panel.y * rh;
  ctx.drawImage(img, dx, dy, dw, dh);
}

function fitFont(ctx, text, maxWidth, startPx, weight = 900) {
  let px = startPx;
  while (px > 12) {
    ctx.font = `${weight} ${px}px ${FONT}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    px -= 2;
  }
  return px;
}

function paintTitle(ctx, W, H, state) {
  const title = (state.title || "").toUpperCase();
  const bandTop = H * 0.66;
  const scrim = ctx.createLinearGradient(0, bandTop - H * 0.08, 0, H);
  scrim.addColorStop(0, "rgba(8, 4, 18, 0)");
  scrim.addColorStop(1, "rgba(8, 4, 18, 0.82)");
  ctx.fillStyle = scrim;
  ctx.fillRect(0, bandTop - H * 0.08, W, H * 0.34 + H * 0.08);

  const pad = W * 0.055;
  const maxW = W - pad * 2;
  const px = fitFont(ctx, title || " ", maxW, Math.round(W * 0.088));
  const ty = H - H * 0.085;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.lineJoin = "round";

  if (state.titleStyle === "gradient") {
    const g = ctx.createLinearGradient(pad, 0, W - pad, 0);
    g.addColorStop(0, "#ff2d95");
    g.addColorStop(0.55, "#ff7a3d");
    g.addColorStop(1, "#ffc93d");
    ctx.strokeStyle = "#160a2e";
    ctx.lineWidth = Math.max(4, px * 0.14);
    ctx.strokeText(title, pad, ty);
    ctx.fillStyle = g;
    ctx.fillText(title, pad, ty);
  } else if (state.titleStyle === "solid") {
    ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
    ctx.shadowBlur = Math.round(px * 0.12);
    ctx.shadowOffsetY = Math.round(px * 0.05);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(title, pad, ty);
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  } else {
    ctx.fillStyle = "rgba(10, 5, 24, 0.35)";
    ctx.fillText(title, pad, ty);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = Math.max(2, px * 0.045);
    ctx.strokeText(title, pad, ty);
  }

  if (state.subtitle) {
    const spx = Math.round(W * 0.028);
    ctx.font = `700 ${spx}px ${FONT}`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
    ctx.fillText(state.subtitle, pad, ty + spx * 1.5);
  }
}

function paintRibbon(ctx, W, state) {
  if (!state.ribbon) return;
  const text = state.ribbon.toUpperCase();
  ctx.save();
  ctx.translate(W - W * 0.02, W * 0.055);
  ctx.rotate(0.1);
  ctx.font = `900 ${Math.round(W * 0.032)}px ${FONT}`;
  const tw = ctx.measureText(text).width;
  const bw = tw + W * 0.05;
  const bh = W * 0.062;
  ctx.fillStyle = "#e8232a";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-bw, 0);
  ctx.lineTo(-bw - bh * 0.55, bh / 2);
  ctx.lineTo(-bw, bh);
  ctx.lineTo(0, bh);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, -bw / 2, bh / 2 + 1);
  ctx.restore();
}

function paintHalftone(ctx, W, H) {
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.28)";
  const step = Math.round(W * 0.022);
  const zoneTop = H * 0.6;
  for (let y = zoneTop; y < H - step; y += step) {
    const row = Math.round((y - zoneTop) / step);
    for (let x = step; x < W * 0.5; x += step) {
      const r = 1 + ((row + Math.round(x / step)) % 3);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function paintGrain(ctx, W, H) {
  const rnd = mulberry32(20261119);
  const count = Math.floor((W * H) / 240);
  ctx.save();
  for (let i = 0; i < count; i++) {
    const v = rnd();
    ctx.fillStyle = v > 0.5 ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
    ctx.fillRect(rnd() * W, rnd() * H, 1.4, 1.4);
  }
  ctx.restore();
}

function paintVignette(ctx, W, H) {
  const g = ctx.createRadialGradient(
    W / 2, H / 2, Math.min(W, H) * 0.42,
    W / 2, H / 2, Math.max(W, H) * 0.72,
  );
  g.addColorStop(0, "rgba(0, 0, 0, 0)");
  g.addColorStop(1, "rgba(0, 0, 0, 0.42)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

export function paint(ctx, W, H, state, images, opts = {}) {
  const grade = GRADES[state.grade] || GRADES.vice;
  const rects = LAYOUTS[state.layout].rects();
  const gap = Math.max(2, Math.round(W * 0.006));

  ctx.save();
  ctx.fillStyle = "#0d0a14";
  ctx.fillRect(0, 0, W, H);

  rects.forEach((rect, i) => {
    const panel = state.panels[i];
    const img = images[panel ? panel.photo : 0];
    const rx = rect.x * W;
    const ry = rect.y * H;
    const rw = rect.w * W;
    const rh = rect.h * H;
    ctx.save();
    ctx.translate(rx + rw / 2, ry + rh / 2);
    if (rect.r) ctx.rotate((rect.r * Math.PI) / 180);
    ctx.translate(-rw / 2, -rh / 2);
    ctx.beginPath();
    ctx.rect(0, 0, rw, rh);
    ctx.clip();
    if (img) {
      ctx.filter = grade.filter;
      drawCoverPhoto(ctx, img, 0, 0, rw, rh, panel || { zoom: 1, x: 0, y: 0 });
      ctx.filter = "none";
      ctx.fillStyle = grade.wash;
      ctx.fillRect(0, 0, rw, rh);
    } else {
      ctx.fillStyle = "#241a3a";
      ctx.fillRect(0, 0, rw, rh);
    }
    ctx.restore();

    ctx.save();
    ctx.translate(rx + rw / 2, ry + rh / 2);
    if (rect.r) ctx.rotate((rect.r * Math.PI) / 180);
    ctx.translate(-rw / 2, -rh / 2);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = gap;
    ctx.strokeRect(gap / 2, gap / 2, rw - gap, rh - gap);
    if (opts.markSelected && i === state.selected) {
      ctx.strokeStyle = "#ffd23d";
      ctx.lineWidth = Math.max(3, gap * 1.6);
      ctx.setLineDash([14, 8]);
      ctx.strokeRect(gap, gap, rw - gap * 2, rh - gap * 2);
      ctx.setLineDash([]);
    }
    ctx.restore();
  });

  paintTitle(ctx, W, H, state);
  paintRibbon(ctx, W, state);
  if (state.halftone) paintHalftone(ctx, W, H);
  if (state.vignette) paintVignette(ctx, W, H);
  if (state.grain) paintGrain(ctx, W, H);
  ctx.restore();
}
