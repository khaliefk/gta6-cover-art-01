// Procedural sample scenes for Vice Lights Press.
// Each scene paints a stylised Vice City photo onto a 2D canvas with plain
// canvas shapes and gradients: no image files, nothing fetched, everything
// drawn here. Deterministic: the same seed paints the same scene every time.

export const SCENE_NAMES = ['sunset', 'neon', 'pier'];

export const SCENE_LABELS = {
  sunset: 'Sunset Boulevard',
  neon: 'Neon Street',
  pier: 'Pier Morning',
};

/** A small deterministic PRNG (mulberry32). */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function skyline(ctx, rnd, w, horizon, color) {
  ctx.fillStyle = color;
  let x = 0;
  while (x < w) {
    const bw = 30 + rnd() * 70;
    const bh = 40 + rnd() * 130;
    ctx.fillRect(x, horizon - bh, bw, bh);
    if (rnd() > 0.6) {
      ctx.fillRect(x + bw * 0.3, horizon - bh - 18, bw * 0.25, 18);
    }
    x += bw + 4 + rnd() * 14;
  }
}

function palm(ctx, x, baseY, s, lean, color) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(3, 7 * s);
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.quadraticCurveTo(x + lean * 60 * s, baseY - 90 * s, x + lean * 110 * s, baseY - 170 * s);
  ctx.stroke();
  const topX = x + lean * 110 * s;
  const topY = baseY - 170 * s;
  ctx.lineWidth = Math.max(2, 4 * s);
  for (let i = 0; i < 7; i++) {
    const a = (-160 + i * 52) * (Math.PI / 180);
    const len = (52 + ((i * 37) % 26)) * s;
    const cx = topX + Math.cos(a) * len;
    const cy = topY + Math.sin(a) * len * 0.55 + 26 * s;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX + Math.cos(a) * len * 0.5, topY + Math.sin(a) * len * 0.5 - 14 * s, cx, cy);
    ctx.stroke();
  }
  // Coconuts.
  ctx.beginPath();
  ctx.arc(topX - 6 * s, topY + 8 * s, 5 * s, 0, Math.PI * 2);
  ctx.arc(topX + 7 * s, topY + 10 * s, 5 * s, 0, Math.PI * 2);
  ctx.fill();
}

function birds(ctx, rnd, w, y0) {
  ctx.strokeStyle = 'rgba(30, 10, 40, 0.75)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    const bx = rnd() * w;
    const by = y0 + rnd() * 60;
    const s = 6 + rnd() * 8;
    ctx.beginPath();
    ctx.moveTo(bx - s, by);
    ctx.quadraticCurveTo(bx - s / 2, by - s * 0.7, bx, by);
    ctx.quadraticCurveTo(bx + s / 2, by - s * 0.7, bx + s, by);
    ctx.stroke();
  }
}

function drawSunset(ctx, w, h) {
  const rnd = mulberry32(20261119);
  const horizon = h * 0.62;
  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, '#2b1055');
  sky.addColorStop(0.45, '#c94b7c');
  sky.addColorStop(0.8, '#ff7e5f');
  sky.addColorStop(1, '#feb47b');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, horizon);
  // Sun with glow.
  const sunX = w * 0.68;
  const sunY = horizon - h * 0.1;
  const sunR = h * 0.11;
  const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 3.2);
  glow.addColorStop(0, 'rgba(255, 236, 180, 0.9)');
  glow.addColorStop(0.35, 'rgba(255, 170, 110, 0.45)');
  glow.addColorStop(1, 'rgba(255, 170, 110, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, horizon);
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();
  // Sea with sun reflection.
  const sea = ctx.createLinearGradient(0, horizon, 0, h);
  sea.addColorStop(0, '#ff9a6b');
  sea.addColorStop(0.25, '#7a4a8a');
  sea.addColorStop(1, '#241040');
  ctx.fillStyle = sea;
  ctx.fillRect(0, horizon, w, h - horizon);
  ctx.fillStyle = 'rgba(255, 240, 200, 0.5)';
  for (let i = 0; i < 26; i++) {
    const y = horizon + 6 + rnd() * (h - horizon - 14);
    const ww = (20 + rnd() * 130) * (1 - (y - horizon) / (h - horizon)) + 14;
    ctx.globalAlpha = 0.12 + rnd() * 0.3;
    ctx.fillRect(sunX - ww / 2 + (rnd() - 0.5) * 40, y, ww, 2.5);
  }
  ctx.globalAlpha = 1;
  // Distant skyline.
  skyline(ctx, rnd, w, horizon, 'rgba(40, 16, 64, 0.85)');
  birds(ctx, rnd, w, h * 0.16);
  // Foreground palms.
  palm(ctx, w * 0.08, h * 1.02, 1.15, 0.6, '#1c0b2e');
  palm(ctx, w * 0.94, h * 1.02, 0.95, -0.7, '#1c0b2e');
  // Road strip at the very bottom.
  ctx.fillStyle = '#1c0b2e';
  ctx.fillRect(0, h * 0.94, w, h * 0.06);
  ctx.fillStyle = 'rgba(255, 220, 120, 0.8)';
  for (let x = 10; x < w; x += 90) ctx.fillRect(x, h * 0.968, 42, 4);
}

function drawNeon(ctx, w, h) {
  const rnd = mulberry32(777);
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#070313');
  sky.addColorStop(0.6, '#150a2e');
  sky.addColorStop(1, '#241040');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  const streetTop = h * 0.58;
  // Buildings.
  const blocks = [
    { x: 0, w: w * 0.24, top: h * 0.16 },
    { x: w * 0.26, w: w * 0.2, top: h * 0.08 },
    { x: w * 0.48, w: w * 0.22, top: h * 0.2 },
    { x: w * 0.72, w: w * 0.28, top: h * 0.12 },
  ];
  for (const b of blocks) {
    ctx.fillStyle = '#0d0620';
    ctx.fillRect(b.x, b.top, b.w, streetTop - b.top);
    ctx.fillStyle = 'rgba(255, 214, 130, 0.55)';
    for (let wy = b.top + 14; wy < streetTop - 16; wy += 26) {
      for (let wx = b.x + 10; wx < b.x + b.w - 12; wx += 24) {
        if (rnd() > 0.45) ctx.fillRect(wx, wy, 10, 14);
      }
    }
  }
  // Neon signs.
  const signs = [
    { x: w * 0.05, y: h * 0.2, w: w * 0.16, h: h * 0.09, color: '#ff2e88', label: 'VICE' },
    { x: w * 0.3, y: h * 0.12, w: w * 0.13, h: h * 0.12, color: '#22e6ff', label: '24H' },
    { x: w * 0.52, y: h * 0.24, w: w * 0.15, h: h * 0.08, color: '#ffd319', label: 'DINER' },
    { x: w * 0.76, y: h * 0.16, w: w * 0.17, h: h * 0.1, color: '#ff2e88', label: 'HOTEL' },
  ];
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const s of signs) {
    ctx.save();
    ctx.shadowColor = s.color;
    ctx.shadowBlur = 26;
    ctx.fillStyle = s.color;
    ctx.globalAlpha = 0.92;
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#14081f';
    ctx.font = `900 ${Math.round(s.h * 0.52)}px "Liberation Sans", sans-serif`;
    ctx.fillText(s.label, s.x + s.w / 2, s.y + s.h / 2 + 1);
    ctx.restore();
  }
  // Wet street with reflections.
  const wet = ctx.createLinearGradient(0, streetTop, 0, h);
  wet.addColorStop(0, '#1b0f33');
  wet.addColorStop(1, '#05020c');
  ctx.fillStyle = wet;
  ctx.fillRect(0, streetTop, w, h - streetTop);
  for (const s of signs) {
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = s.color;
    const rw = s.w * 0.9;
    ctx.fillRect(s.x + (s.w - rw) / 2, streetTop + 8, rw, (h - streetTop) * 0.7);
    ctx.restore();
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
  for (let i = 0; i < 60; i++) {
    const x = rnd() * w;
    const y = streetTop + rnd() * (h - streetTop);
    ctx.fillRect(x, y, 1.5, 8 + rnd() * 14);
  }
  // Rain streaks.
  ctx.strokeStyle = 'rgba(180, 220, 255, 0.25)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 90; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 6, y + 18);
    ctx.stroke();
  }
}

function drawPier(ctx, w, h) {
  const rnd = mulberry32(4242);
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.55);
  sky.addColorStop(0, '#7ec8e3');
  sky.addColorStop(0.7, '#cfeef7');
  sky.addColorStop(1, '#ffe8b3');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h * 0.55);
  // Clouds.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  for (let i = 0; i < 6; i++) {
    const cx = rnd() * w;
    const cy = h * (0.06 + rnd() * 0.2);
    const cw = 60 + rnd() * 120;
    ctx.beginPath();
    ctx.ellipse(cx, cy, cw, cw * 0.22, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + cw * 0.4, cy + 6, cw * 0.6, cw * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Sun.
  const sunX = w * 0.78;
  const sunY = h * 0.16;
  const glow = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, h * 0.3);
  glow.addColorStop(0, 'rgba(255, 244, 200, 0.95)');
  glow.addColorStop(1, 'rgba(255, 244, 200, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h * 0.55);
  ctx.fillStyle = '#fff6cf';
  ctx.beginPath();
  ctx.arc(sunX, sunY, h * 0.06, 0, Math.PI * 2);
  ctx.fill();
  // Sea.
  const sea = ctx.createLinearGradient(0, h * 0.55, 0, h);
  sea.addColorStop(0, '#3fd2c0');
  sea.addColorStop(0.5, '#1d9db4');
  sea.addColorStop(1, '#0b5e7a');
  ctx.fillStyle = sea;
  ctx.fillRect(0, h * 0.55, w, h * 0.45);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 34; i++) {
    const y = h * 0.57 + rnd() * h * 0.36;
    const x = rnd() * w;
    const len = 20 + rnd() * 70;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y);
    ctx.stroke();
  }
  // Sailboat.
  const bx = w * 0.2;
  const by = h * 0.62;
  ctx.fillStyle = '#5b3a1e';
  ctx.beginPath();
  ctx.moveTo(bx - 46, by);
  ctx.lineTo(bx + 46, by);
  ctx.lineTo(bx + 30, by + 16);
  ctx.lineTo(bx - 30, by + 16);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#4a2c14';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(bx, by - 74);
  ctx.stroke();
  ctx.fillStyle = '#fff8ec';
  ctx.beginPath();
  ctx.moveTo(bx + 4, by - 70);
  ctx.lineTo(bx + 4, by - 8);
  ctx.lineTo(bx + 44, by - 8);
  ctx.closePath();
  ctx.fill();
  // Wooden pier from the bottom edge.
  const px = w * 0.62;
  ctx.fillStyle = '#6b4423';
  ctx.beginPath();
  ctx.moveTo(px - 40, h);
  ctx.lineTo(px + 40, h);
  ctx.lineTo(px + 130, h * 0.55);
  ctx.lineTo(px + 30, h * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#8a5a2e';
  for (let i = 0; i < 9; i++) {
    const t = i / 8;
    const y = h - t * h * 0.45;
    const half = 40 - t * 10;
    ctx.fillRect(px - half, y - 5, half * 2, 5);
  }
  ctx.fillStyle = '#4a2c14';
  ctx.fillRect(px + 96, h * 0.6, 10, h * 0.4);
  ctx.fillRect(px + 60, h * 0.68, 10, h * 0.32);
}

/** Paint one scene onto ctx at w x h. */
export function drawScene(ctx, name, w, h) {
  if (name === 'neon') drawNeon(ctx, w, h);
  else if (name === 'pier') drawPier(ctx, w, h);
  else drawSunset(ctx, w, h);
}

/** A fresh offscreen canvas holding one scene. */
export function sceneCanvas(name, w = 1200, h = 900) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  drawScene(canvas.getContext('2d'), name, w, h);
  return canvas;
}
