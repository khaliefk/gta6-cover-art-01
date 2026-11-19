// Neon Boulevard Press: the painter.
//
// One function draws the whole cover on a canvas: the painted sky for
// the postcard layout, one photo per panel with its own pan and zoom,
// the grade wash, the title, the badge ribbon, then halftone dots,
// grain, and the vignette. Everything is plain canvas 2D, no font
// files, no network. The same function paints the preview and the
// export, so the download matches what the page shows.

import { findGrade, findLayout } from "./data.js";

function hexA(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

// A tiny seeded random so the grain looks the same on every repaint.
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function paintSky(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#2b1055");
  g.addColorStop(0.45, "#ff7a3c");
  g.addColorStop(0.62, "#e23a7a");
  g.addColorStop(1, "#1a0b2e");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const sunR = w * 0.16;
  const sun = ctx.createRadialGradient(w / 2, h * 0.34, sunR * 0.1, w / 2, h * 0.34, sunR * 1.8);
  sun.addColorStop(0, "rgba(255,220,130,0.95)");
  sun.addColorStop(0.4, "rgba(255,140,80,0.55)");
  sun.addColorStop(1, "rgba(255,140,80,0)");
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#ffd782";
  ctx.beginPath();
  ctx.arc(w / 2, h * 0.34, sunR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#160a28";
  const base = h * 0.78;
  const tops = [0.66, 0.58, 0.7, 0.62, 0.72, 0.6, 0.68];
  let x = 0;
  for (let i = 0; i < tops.length; i++) {
    const bw = w / tops.length;
    const th = h * tops[i];
    ctx.fillRect(x, base - (base - th), bw * 0.86, base - th + h * 0.06);
    ctx.fillStyle = "rgba(255,200,90,0.85)";
    for (let wy = th + h * 0.03; wy < base - h * 0.02; wy += h * 0.045) {
      for (let wx = x + w * 0.012; wx < x + bw * 0.8; wx += w * 0.03) {
        if ((wx * 7 + wy * 13) % 5 < 2) ctx.fillRect(wx, wy, w * 0.012, h * 0.014);
      }
    }
    ctx.fillStyle = "#160a28";
    x += bw;
  }
  ctx.fillRect(0, base, w, h - base);
  drawPalm(ctx, w * 0.06, base + h * 0.02, w * 0.09);
  drawPalm(ctx, w * 0.94, base + h * 0.02, w * 0.08);
}

function drawPalm(ctx, x, y, s) {
  ctx.strokeStyle = "#12081f";
  ctx.lineWidth = Math.max(4, s * 0.12);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + s * 0.15, y - s * 0.7, x + s * 0.3, y - s * 1.1);
  ctx.stroke();
  const tx = x + s * 0.3;
  const ty = y - s * 1.1;
  ctx.lineWidth = Math.max(3, s * 0.07);
  for (let a = -160; a <= 10; a += 26) {
    const r = (a * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(
      tx + Math.cos(r) * s * 0.45, ty + Math.sin(r) * s * 0.3,
      tx + Math.cos(r) * s * 0.8, ty + Math.sin(r) * s * 0.45 + s * 0.22,
    );
    ctx.stroke();
  }
}

// Fits a photo inside a box, cover style, with the panel's pan and zoom.
function drawPhoto(ctx, img, box, pan) {
  const scale = Math.max(box.w / img.naturalWidth, box.h / img.naturalHeight) * pan.zoom;
  const pw = img.naturalWidth * scale;
  const ph = img.naturalHeight * scale;
  const dx = box.x + (box.w - pw) / 2 + pan.px * box.w;
  const dy = box.y + (box.h - ph) / 2 + pan.py * box.h;
  ctx.drawImage(img, dx, dy, pw, ph);
}

function fitTitle(ctx, text, boxW, start) {
  let size = start;
  ctx.font = `900 ${size}px Impact, "Arial Black", sans-serif`;
  while (ctx.measureText(text).width > boxW && size > 14) {
    size -= 4;
    ctx.font = `900 ${size}px Impact, "Arial Black", sans-serif`;
  }
  return size;
}

function paintTitle(ctx, state, zone, w, h) {
  const title = state.title.trim().toUpperCase();
  const sub = state.subtitle.trim();
  const zx = zone.x * w;
  const zy = zone.y * h;
  const zw = zone.w * w;
  const zh = zone.h * h;
  if (zone.mode === "card") {
    ctx.fillStyle = "#12081f";
    ctx.fillRect(zx, zy, zw, zh);
    ctx.strokeStyle = "#ff7a3c";
    ctx.lineWidth = Math.max(3, w * 0.004);
    ctx.strokeRect(zx + 4, zy + 4, zw - 8, zh - 8);
  } else if (zone.mode === "strip") {
    ctx.fillStyle = "rgba(10,6,20,0.82)";
    ctx.fillRect(zx, zy, zw, zh);
  } else if (zone.mode === "fade") {
    const g = ctx.createLinearGradient(0, zy, 0, zy + zh);
    g.addColorStop(0, "rgba(10,6,20,0)");
    g.addColorStop(1, "rgba(10,6,20,0.88)");
    ctx.fillStyle = g;
    ctx.fillRect(zx, zy, zw, zh);
  }
  if (!title) return;
  const pad = zw * 0.06;
  const size = fitTitle(ctx, title, zw - pad * 2, Math.min(zh * 0.52, w * 0.09));
  const cx = zx + zw / 2;
  const ty = zy + zh / 2 + (sub ? size * 0.08 : size * 0.36);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  if (state.titleStyle === "gradient") {
    const g = ctx.createLinearGradient(cx - zw / 2, ty - size / 2, cx + zw / 2, ty + size / 2);
    g.addColorStop(0, "#ffd782");
    g.addColorStop(0.5, "#ff7a3c");
    g.addColorStop(1, "#e23a7a");
    ctx.fillStyle = g;
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = size * 0.14;
    ctx.fillText(title, cx, ty);
    ctx.shadowBlur = 0;
  } else if (state.titleStyle === "solid") {
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = size * 0.12;
    ctx.fillText(title, cx, ty);
    ctx.shadowBlur = 0;
  } else {
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = Math.max(2, size * 0.06);
    ctx.strokeText(title, cx, ty);
  }
  if (sub) {
    const subSize = Math.max(14, size * 0.24);
    ctx.font = `600 ${subSize}px system-ui, sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fillText(sub, cx, ty + size * 0.62);
  }
}

function paintRibbon(ctx, w, h, text) {
  if (!text.trim()) return;
  const fs = Math.max(16, w * 0.022);
  ctx.font = `800 ${fs}px system-ui, sans-serif`;
  const tw = ctx.measureText(text.trim().toUpperCase()).width;
  const bw = tw + fs * 1.6;
  const bh = fs * 1.9;
  const x = w - bw - w * 0.03;
  const y = h * 0.03;
  ctx.fillStyle = "#ff2e63";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + bw, y);
  ctx.lineTo(x + bw, y + bh);
  ctx.lineTo(x + bw - bh * 0.4, y + bh + bh * 0.35);
  ctx.lineTo(x, y + bh);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text.trim().toUpperCase(), x + bw / 2, y + bh / 2 + 1);
}

function paintHalftone(ctx, w, h) {
  const step = Math.max(14, w * 0.016);
  ctx.fillStyle = "rgba(10,6,20,0.28)";
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 12; col++) {
      const r = step * 0.16 * (1 + row * 0.5);
      ctx.beginPath();
      ctx.arc(w * 0.03 + col * step, h * 0.02 + row * step, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function paintGrain(ctx, w, h) {
  const rand = rng(20261119);
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  const n = Math.floor((w * h) / 9000);
  for (let i = 0; i < n; i++) {
    ctx.fillRect(rand() * w, rand() * h, 2, 2);
  }
  ctx.fillStyle = "rgba(0,0,0,0.06)";
  for (let i = 0; i < n; i++) {
    ctx.fillRect(rand() * w, rand() * h, 2, 2);
  }
}

function paintVignette(ctx, w, h) {
  const g = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.42)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

// Panel boxes in pixels for a canvas of w by h.
export function panelBoxes(layout, w, h) {
  return layout.panels.map((p) => ({
    x: p.x * w, y: p.y * h, w: p.w * w, h: p.h * h, tilt: p.tilt || 0,
  }));
}

export function drawCover(canvas, state, photos) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const layout = findLayout(state.layout);
  const grade = findGrade(state.grade);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#12081f";
  ctx.fillRect(0, 0, w, h);
  if (layout.sky) paintSky(ctx, w, h);
  const boxes = panelBoxes(layout, w, h);
  boxes.forEach((box, i) => {
    const pan = state.panels[i] || { photo: null, px: 0, py: 0, zoom: 1 };
    const img = pan.photo ? photos.get(pan.photo) : null;
    ctx.save();
    if (box.tilt) {
      ctx.translate(box.x + box.w / 2, box.y + box.h / 2);
      ctx.rotate((box.tilt * Math.PI) / 180);
      ctx.translate(-box.w / 2, -box.h / 2);
    } else {
      ctx.translate(box.x, box.y);
    }
    ctx.beginPath();
    ctx.rect(0, 0, box.w, box.h);
    ctx.clip();
    if (layout.sky) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(-w * 0.02, -h * 0.02, box.w + w * 0.04, box.h + h * 0.04);
      const inner = { x: w * 0.012, y: h * 0.012, w: box.w - w * 0.024, h: box.h - h * 0.024 };
      if (img) drawPhoto(ctx, img, inner, pan);
      else { ctx.fillStyle = "#2b1a4a"; ctx.fillRect(inner.x, inner.y, inner.w, inner.h); }
    } else if (img) {
      drawPhoto(ctx, img, { x: 0, y: 0, w: box.w, h: box.h }, pan);
    } else {
      ctx.fillStyle = "#241640";
      ctx.fillRect(0, 0, box.w, box.h);
    }
    ctx.restore();
    if (box.tilt) {
      ctx.save();
      ctx.translate(box.x + box.w / 2, box.y + box.h / 2);
      ctx.rotate((box.tilt * Math.PI) / 180);
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = Math.max(2, w * 0.003);
      ctx.strokeRect(-box.w / 2, -box.h / 2, box.w, box.h);
      ctx.restore();
    }
  });
  // Grade wash over the whole cover.
  ctx.save();
  ctx.globalCompositeOperation = grade.mode;
  const wash = ctx.createLinearGradient(0, 0, 0, h);
  wash.addColorStop(0, grade.top);
  wash.addColorStop(1, grade.bottom);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  paintTitle(ctx, state, layout.title, w, h);
  paintRibbon(ctx, w, h, state.badge);
  if (state.halftone) paintHalftone(ctx, w, h);
  if (state.grain) paintGrain(ctx, w, h);
  if (state.vignette) paintVignette(ctx, w, h);
  // Thin frame so the cover reads as one poster.
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = Math.max(2, w * 0.002);
  ctx.strokeRect(1, 1, w - 2, h - 2);
}

// Which panel sits under a point on the displayed canvas.
export function hitPanel(layout, w, h, px, py) {
  const boxes = panelBoxes(layout, w, h);
  for (let i = boxes.length - 1; i >= 0; i--) {
    const b = boxes[i];
    if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) return i;
  }
  return -1;
}
