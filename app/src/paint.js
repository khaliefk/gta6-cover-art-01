// Neon Boulevard Press: the cover painter. One function draws the whole
// cover on a canvas, at any size, from the cover state and the loaded
// photos. The preview and the exported PNG run this same code, so the two
// always match.

import { findLayout, findGrade, findSize } from "./data.js";

// A tiny seeded random stream. The skyline and the grain stay the same on
// every draw because the seed never changes.
function rng(seed) {
  let s = seed >>> 0;
  return function () {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

// Where the photo lands inside its panel: cover fit, then zoom and pan.
function fitPhoto(img, px, py, pw, ph, slot) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(pw / iw, ph / ih) * slot.zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const maxOx = Math.max(0, (dw - pw) / 2 / pw);
  const maxOy = Math.max(0, (dh - ph) / 2 / ph);
  const ox = clamp(slot.ox, -maxOx, maxOx);
  const oy = clamp(slot.oy, -maxOy, maxOy);
  return {
    dx: px + (pw - dw) / 2 + ox * pw,
    dy: py + (ph - dh) / 2 + oy * ph,
    dw,
    dh,
  };
}

function paintPhoto(ctx, img, px, py, pw, ph, slot, grade) {
  const r = fitPhoto(img, px, py, pw, ph, slot);
  ctx.save();
  ctx.beginPath();
  ctx.rect(px, py, pw, ph);
  ctx.clip();
  ctx.filter = grade.filter;
  ctx.drawImage(img, r.dx, r.dy, r.dw, r.dh);
  ctx.filter = "none";
  const wash = ctx.createLinearGradient(px, py, px, py + ph);
  wash.addColorStop(0, grade.wash.top);
  wash.addColorStop(1, grade.wash.bottom);
  ctx.globalCompositeOperation = grade.wash.mode;
  ctx.globalAlpha = grade.wash.strength;
  ctx.fillStyle = wash;
  ctx.fillRect(px, py, pw, ph);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.fillStyle = grade.veil;
  ctx.fillRect(px, py, pw, ph);
  ctx.restore();
}

function paintEdge(ctx, px, py, pw, ph, w) {
  const lw = Math.max(2, w * 0.004);
  ctx.save();
  ctx.lineWidth = lw;
  ctx.strokeStyle = "rgba(255,255,255,0.92)";
  ctx.strokeRect(px + lw / 2, py + lw / 2, pw - lw, ph - lw);
  ctx.restore();
}

function paintPalm(ctx, bx, by, len, dir) {
  ctx.save();
  ctx.strokeStyle = "#160a2b";
  ctx.fillStyle = "#160a2b";
  ctx.lineWidth = Math.max(4, len * 0.03);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.quadraticCurveTo(bx + dir * len * 0.12, by - len * 0.6, bx + dir * len * 0.22, by - len);
  ctx.stroke();
  const cx = bx + dir * len * 0.22;
  const cy = by - len;
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i - 2.5) * 0.5;
    const fx = cx + Math.cos(a) * len * 0.42;
    const fy = cy + Math.sin(a) * len * 0.42 + len * 0.16;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.quadraticCurveTo(
      cx + Math.cos(a) * len * 0.22,
      cy + Math.sin(a) * len * 0.22 - len * 0.05,
      fx,
      fy
    );
    ctx.lineWidth = Math.max(3, len * 0.02);
    ctx.stroke();
  }
  ctx.restore();
}

// Painted sunset sky for the postcard layout: gradient, sun, skyline, and
// two palm silhouettes. All drawn in code, no photo needed.
function paintSky(ctx, W, H) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#2b1055");
  sky.addColorStop(0.42, "#ff2975");
  sky.addColorStop(0.72, "#ff9a3d");
  sky.addColorStop(1, "#ffd319");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  const sunX = W * 0.72;
  const sunY = H * 0.3;
  const sunR = W * 0.085;
  const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 2.6);
  glow.addColorStop(0, "rgba(255,243,196,0.85)");
  glow.addColorStop(1, "rgba(255,243,196,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#fff3c4";
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();

  const next = rng(77);
  ctx.fillStyle = "#1c0b33";
  let x = 0;
  while (x < W) {
    const bw = W * (0.06 + next() * 0.09);
    const bh = H * (0.1 + next() * 0.16);
    ctx.fillRect(x, H - bh, bw, bh);
    ctx.fillStyle = "rgba(255,211,25,0.75)";
    for (let k = 0; k < 5; k++) {
      if (next() > 0.5) {
        ctx.fillRect(x + bw * (0.15 + next() * 0.7), H - bh + bh * (0.15 + next() * 0.6), 3, 4);
      }
    }
    ctx.fillStyle = "#1c0b33";
    x += bw + W * 0.012;
  }
  paintPalm(ctx, W * 0.08, H * 0.98, H * 0.34, -1);
  paintPalm(ctx, W * 0.94, H * 0.98, H * 0.3, 1);
}

function titlePaint(ctx, style, x, y, w, h) {
  if (style === "paper") return "#ffffff";
  if (style === "hollow") return "#1a0b26";
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, "#ffd319");
  g.addColorStop(0.5, "#ff2975");
  g.addColorStop(1, "#8c1eff");
  return g;
}

function paintWords(ctx, cover, zx, zy, zw, zh) {
  const family = `"Arial Narrow", "Liberation Sans Narrow", Impact, "Helvetica Neue", sans-serif`;
  const title = (cover.title || "UNTITLED").toUpperCase();
  const sub = cover.subtitle || "";
  // The title is drawn squeezed to 85 percent of its width, so it reads
  // condensed even on a machine with no condensed font installed.
  const squeeze = 0.85;
  let lines = [title];
  const words = title.split(" ");
  if (words.length > 1) {
    ctx.font = `900 ${zh * 0.46}px ${family}`;
    if (ctx.measureText(title).width * squeeze > zw * 0.96) {
      // A long title in a narrow zone wraps to two lines. Split on the
      // word break that balances the two lines best.
      let best = null;
      for (let i = 1; i < words.length; i++) {
        const a = words.slice(0, i).join(" ");
        const b = words.slice(i).join(" ");
        const m = Math.max(a.length, b.length);
        if (!best || m < best.m) best = { m, lines: [a, b] };
      }
      lines = best.lines;
    }
  }
  const lineH = (px) => px * 1.08;
  const subH = (px) => (sub ? px * 0.55 : 0);
  let px = Math.min(zh * (sub ? 0.46 : 0.62), (zh * 0.8) / (lines.length * 1.08 + (sub ? 0.5 : 0)));
  ctx.font = `900 ${px}px ${family}`;
  let widest = 0;
  for (const ln of lines) widest = Math.max(widest, ctx.measureText(ln).width);
  while (px > 12 && widest * squeeze > zw * 0.96) {
    px -= 2;
    ctx.font = `900 ${px}px ${family}`;
    widest = 0;
    for (const ln of lines) widest = Math.max(widest, ctx.measureText(ln).width);
  }
  const cx = zx + zw / 2;
  const blockH = lineH(px) * lines.length + subH(px);
  const yTop = zy + (zh - blockH) / 2;

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if ("letterSpacing" in ctx) ctx.letterSpacing = `${Math.max(1, px * 0.02)}px`;
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = px * 0.08;
  ctx.shadowOffsetY = px * 0.03;
  ctx.lineJoin = "round";
  ctx.font = `900 ${px}px ${family}`;
  ctx.lineWidth = px * (cover.titleStyle === "hollow" ? 0.045 : 0.06);
  ctx.strokeStyle = cover.titleStyle === "hollow" ? "#ffffff" : "#14060f";
  lines.forEach((ln, i) => {
    const cy = yTop + lineH(px) * (i + 0.5);
    // Build the fill first, in absolute coordinates: the vertical gradient
    // must not pass through the squeeze transform below.
    const fill = titlePaint(ctx, cover.titleStyle, cx - zw / 2, cy - px / 2, zw, px);
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
    ctx.fillText(sub, cx, yTop + lineH(px) * lines.length + subH(px) * 0.6);
    ctx.restore();
  }
}

function paintDots(ctx, zx, zy, zw, zh, W) {
  const step = Math.max(10, W * 0.022);
  ctx.save();
  ctx.beginPath();
  ctx.rect(zx, zy, zw, zh);
  ctx.clip();
  ctx.fillStyle = "rgba(255,255,255,0.10)";
  for (let y = zy + step / 2; y < zy + zh; y += step) {
    for (let x = zx + step / 2; x < zx + zw; x += step) {
      ctx.beginPath();
      ctx.arc(x, y, Math.max(1.5, step * 0.14), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function paintRibbon(ctx, cover, W, H) {
  const text = (cover.badge || "").trim();
  if (!text) return;
  const px = Math.max(13, W * 0.022);
  ctx.save();
  ctx.font = `900 ${px}px "Arial Narrow", "Liberation Sans Narrow", Impact, sans-serif`;
  const tw = ctx.measureText(text).width;
  const bw = tw + px * 1.6;
  const bh = px * 1.9;
  ctx.translate(W - bw - W * 0.02, H * 0.025);
  ctx.rotate(-0.06);
  ctx.fillStyle = "#ffd319";
  ctx.strokeStyle = "#14060f";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.rect(0, 0, bw, bh);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#14060f";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, bw / 2, bh / 2 + 1);
  ctx.restore();
}

function paintGrain(ctx, W, H) {
  const next = rng(20261119);
  const n = Math.floor((W * H) / 1400);
  ctx.save();
  for (let i = 0; i < n; i++) {
    const v = next();
    ctx.fillStyle =
      v > 0.5
        ? `rgba(255,255,255,${0.05 + next() * 0.05})`
        : `rgba(0,0,0,${0.05 + next() * 0.05})`;
    ctx.fillRect(next() * W, next() * H, 1 + next() * 1.5, 1 + next() * 1.5);
  }
  ctx.restore();
}

function paintShade(ctx, W, H) {
  const g = ctx.createRadialGradient(
    W / 2, H / 2, Math.min(W, H) * 0.42,
    W / 2, H / 2, Math.max(W, H) * 0.75
  );
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.32)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

// Which panel sits under a point in cover pixels, for clicks and drags.
export function panelAtPoint(cover, x, y, W, H) {
  const layout = findLayout(cover.layout);
  for (let i = layout.panels.length - 1; i >= 0; i--) {
    const p = layout.panels[i];
    const px = p.x * W;
    const py = p.y * H;
    const pw = p.w * W;
    const ph = p.h * H;
    if (!p.rot) {
      if (x >= px && x <= px + pw && y >= py && y <= py + ph) return i;
    } else {
      const cx = px + pw / 2;
      const cy = py + ph / 2;
      const a = (-p.rot * Math.PI) / 180;
      const dx = x - cx;
      const dy = y - cy;
      const rx = dx * Math.cos(a) - dy * Math.sin(a);
      const ry = dx * Math.sin(a) + dy * Math.cos(a);
      if (Math.abs(rx) <= pw / 2 && Math.abs(ry) <= ph / 2) return i;
    }
  }
  return -1;
}

export function paintCover(canvas, cover, photos) {
  const size = findSize(cover.size);
  const W = size.w;
  const H = size.h;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  const layout = findLayout(cover.layout);
  const grade = findGrade(cover.grade);
  const slots = cover.panels[cover.layout] || [];

  ctx.fillStyle = "#0c0a10";
  ctx.fillRect(0, 0, W, H);
  if (layout.bg === "sky") paintSky(ctx, W, H);

  layout.panels.forEach((p, i) => {
    const px = p.x * W;
    const py = p.y * H;
    const pw = p.w * W;
    const ph = p.h * H;
    const slot = slots[i] || { photo: 0, zoom: 1, ox: 0, oy: 0 };
    const photo = cover.photos[slot.photo] || cover.photos[0];
    const img = photo ? photos.get(photo.id) : null;
    ctx.save();
    if (p.rot) {
      ctx.translate(px + pw / 2, py + ph / 2);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.translate(-pw / 2, -ph / 2);
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = W * 0.02;
      ctx.shadowOffsetY = H * 0.008;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(-pw * 0.04, -ph * 0.04, pw * 1.08, ph * 1.16);
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      if (img) paintPhoto(ctx, img, 0, 0, pw, ph, slot, grade);
      else {
        ctx.fillStyle = "#3a3049";
        ctx.fillRect(0, 0, pw, ph);
      }
      ctx.fillStyle = "#241a2e";
      ctx.font = `italic 700 ${Math.max(12, pw * 0.045)}px Georgia, serif`;
      ctx.textAlign = "center";
      ctx.fillText(photo ? photo.name : "", pw / 2, ph * 1.09);
      ctx.restore();
      return;
    }
    if (img) paintPhoto(ctx, img, px, py, pw, ph, slot, grade);
    else {
      ctx.fillStyle = "#3a3049";
      ctx.fillRect(px, py, pw, ph);
    }
    if (cover.frame) paintEdge(ctx, px, py, pw, ph, W);
    ctx.restore();
  });

  const t = layout.title;
  const tx = t.x * W;
  const ty = t.y * H;
  const tw = t.w * W;
  const th = t.h * H;
  if (t.mode === "cell") {
    ctx.fillStyle = "#1b0f2e";
    ctx.fillRect(tx, ty, tw, th);
    ctx.strokeStyle = "#ffd319";
    ctx.lineWidth = Math.max(2, W * 0.003);
    ctx.strokeRect(tx + 1, ty + 1, tw - 2, th - 2);
    if (cover.halftone) paintDots(ctx, tx, ty, tw, th, W);
    paintWords(ctx, cover, tx, ty, tw, th);
  } else if (t.mode === "band") {
    ctx.fillStyle = "rgba(10,6,16,0.88)";
    ctx.fillRect(tx, ty, tw, th);
    ctx.fillStyle = "#ff2975";
    ctx.fillRect(tx, ty, tw, Math.max(3, H * 0.006));
    if (cover.halftone) paintDots(ctx, tx, ty, tw, th, W);
    paintWords(ctx, cover, tx, ty, tw, th);
  } else if (t.mode === "scrim") {
    const scrim = ctx.createLinearGradient(0, ty, 0, ty + th);
    scrim.addColorStop(0, "rgba(5,2,10,0)");
    scrim.addColorStop(1, "rgba(5,2,10,0.85)");
    ctx.fillStyle = scrim;
    ctx.fillRect(tx, ty, tw, th);
    paintWords(ctx, cover, tx, ty, tw, th);
  } else {
    paintWords(ctx, cover, tx, ty, tw, th);
  }

  paintRibbon(ctx, cover, W, H);
  if (cover.grain) paintGrain(ctx, W, H);
  if (cover.vignette) paintShade(ctx, W, H);
}
