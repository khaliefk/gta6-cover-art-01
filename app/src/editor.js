// Neon Boulevard Press: the editor. Wires the controls to the painter,
// loads photos, and handles panel clicks, drags, zoom and export.

import {
  SAMPLES,
  SIZES,
  TITLE_STYLES,
  LAYOUTS,
  GRADES,
  freshCover,
  fillPanels,
  copyCover,
  findLayout,
} from "./data.js";
import { paintCover, panelAtPoint } from "./paint.js";

const cover = fillPanels(freshCover());
const photos = new Map();
const canvas = document.getElementById("stage");
const tray = document.getElementById("tray");
const query = new URLSearchParams(location.search);
const shotMode = query.get("shot");

let past = [];
let future = [];
let uploadCount = 0;
let drag = null;
let dragStart = null;

const $ = (id) => document.getElementById(id);

function loadPhoto(photo) {
  return new Promise((resolve) => {
    if (photos.has(photo.id)) return resolve(photos.get(photo.id));
    const img = new Image();
    img.onload = () => {
      photos.set(photo.id, img);
      resolve(img);
    };
    img.onerror = () => resolve(null);
    img.src = photo.src;
  });
}

async function loadAllPhotos() {
  await Promise.all(cover.photos.map(loadPhoto));
}

function draw() {
  paintCover(canvas, cover, photos);
  drawPick();
  syncControls();
}

function drawPick() {
  if (shotMode === "cover" || cover.selected < 0) return;
  const layout = findLayout(cover.layout);
  const p = layout.panels[cover.selected];
  if (!p) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  ctx.save();
  ctx.strokeStyle = "#2dd4bf";
  ctx.lineWidth = Math.max(3, W * 0.006);
  ctx.setLineDash([14, 8]);
  ctx.strokeRect(p.x * W + 2, p.y * H + 2, p.w * W - 4, p.h * H - 4);
  ctx.restore();
}

function remember() {
  past.push(copyCover(cover));
  if (past.length > 60) past.shift();
  future = [];
  syncHistoryButtons();
}

function restore(snap) {
  const keep = cover.photos;
  const next = copyCover(snap);
  next.photos = keep;
  Object.keys(cover).forEach((k) => delete cover[k]);
  Object.assign(cover, next);
  fillPanels(cover);
}

function undo() {
  if (!past.length) return;
  future.push(copyCover(cover));
  restore(past.pop());
  draw();
  syncHistoryButtons();
}

function redo() {
  if (!future.length) return;
  past.push(copyCover(cover));
  restore(future.pop());
  draw();
  syncHistoryButtons();
}

function syncHistoryButtons() {
  $("btn-undo").disabled = past.length === 0;
  $("btn-redo").disabled = future.length === 0;
}

function chip(label, active, onClick) {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = label;
  if (active) b.classList.add("active");
  b.addEventListener("click", onClick);
  return b;
}

function syncControls() {
  const layoutsEl = $("layouts");
  layoutsEl.textContent = "";
  for (const l of LAYOUTS) {
    layoutsEl.appendChild(
      chip(l.name, l.id === cover.layout, () => {
        if (cover.layout === l.id) return;
        remember();
        cover.layout = l.id;
        cover.selected = 0;
        draw();
      })
    );
  }
  const gradesEl = $("grades");
  gradesEl.textContent = "";
  for (const g of GRADES) {
    gradesEl.appendChild(
      chip(g.name, g.id === cover.grade, () => {
        if (cover.grade === g.id) return;
        remember();
        cover.grade = g.id;
        draw();
      })
    );
  }
  const stylesEl = $("title-styles");
  stylesEl.textContent = "";
  for (const s of TITLE_STYLES) {
    stylesEl.appendChild(
      chip(s.name, s.id === cover.titleStyle, () => {
        if (cover.titleStyle === s.id) return;
        remember();
        cover.titleStyle = s.id;
        draw();
      })
    );
  }
  const sizesEl = $("sizes");
  sizesEl.textContent = "";
  for (const s of SIZES) {
    sizesEl.appendChild(
      chip(s.name, s.id === cover.size, () => {
        if (cover.size === s.id) return;
        remember();
        cover.size = s.id;
        draw();
      })
    );
  }
  $("in-title").value = cover.title;
  $("in-subtitle").value = cover.subtitle;
  $("in-badge").value = cover.badge;
  $("ck-grain").checked = cover.grain;
  $("ck-vignette").checked = cover.vignette;
  $("ck-frame").checked = cover.frame;
  $("ck-halftone").checked = cover.halftone;
  const layout = findLayout(cover.layout);
  const slot = (cover.panels[cover.layout] || [])[cover.selected];
  $("panel-label").textContent =
    cover.selected < 0 || !slot
      ? "No panel selected yet. Click any panel on the cover."
      : `Panel ${cover.selected + 1} of ${layout.panels.length}. Photo: ${(cover.photos[slot.photo] || {}).name || "none"}. Zoom ${slot.zoom.toFixed(2)}x.`;
  for (const img of tray.querySelectorAll("img")) {
    img.classList.toggle("picked", slot && Number(img.dataset.photo) === slot.photo);
  }
}

function buildTray() {
  tray.textContent = "";
  cover.photos.forEach((photo, i) => {
    const img = document.createElement("img");
    img.src = photo.src;
    img.alt = photo.name;
    img.title = photo.name;
    img.dataset.photo = String(i);
    img.addEventListener("click", () => {
      if (cover.selected < 0) cover.selected = 0;
      remember();
      const slots = cover.panels[cover.layout];
      if (slots[cover.selected]) slots[cover.selected].photo = i;
      draw();
    });
    tray.appendChild(img);
  });
}

function canvasPoint(ev) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((ev.clientX - rect.left) / rect.width) * canvas.width,
    y: ((ev.clientY - rect.top) / rect.height) * canvas.height,
  };
}

canvas.addEventListener("pointerdown", (ev) => {
  if (shotMode === "cover") return;
  dragStart = copyCover(cover);
  const pt = canvasPoint(ev);
  const idx = panelAtPoint(cover, pt.x, pt.y, canvas.width, canvas.height);
  if (idx < 0) return;
  cover.selected = idx;
  const layout = findLayout(cover.layout);
  const p = layout.panels[idx];
  drag = {
    idx,
    startX: pt.x,
    startY: pt.y,
    moved: false,
    pw: p.w * canvas.width,
    ph: p.h * canvas.height,
  };
  canvas.setPointerCapture(ev.pointerId);
  draw();
});

canvas.addEventListener("pointermove", (ev) => {
  if (!drag) return;
  const pt = canvasPoint(ev);
  const dx = pt.x - drag.startX;
  const dy = pt.y - drag.startY;
  if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
  if (!drag.moved) return;
  const slot = cover.panels[cover.layout][drag.idx];
  slot.ox += dx / drag.pw;
  slot.oy += dy / drag.ph;
  drag.startX = pt.x;
  drag.startY = pt.y;
  draw();
});

canvas.addEventListener("pointerup", () => {
  if (!drag) return;
  // A drag writes many small moves. Keep one history entry for the whole drag.
  if (drag.moved && dragStart) {
    past.push(dragStart);
    if (past.length > 60) past.shift();
    future = [];
    syncHistoryButtons();
  }
  drag = null;
  dragStart = null;
});

canvas.addEventListener(
  "wheel",
  (ev) => {
    if (shotMode === "cover") return;
    ev.preventDefault();
    const pt = canvasPoint(ev);
    const idx = panelAtPoint(cover, pt.x, pt.y, canvas.width, canvas.height);
    if (idx < 0) return;
    remember();
    const slot = cover.panels[cover.layout][idx];
    slot.zoom = Math.min(4, Math.max(1, slot.zoom * (ev.deltaY < 0 ? 1.12 : 1 / 1.12)));
    cover.selected = idx;
    draw();
  },
  { passive: false }
);

function bindText(id, key) {
  const el = $(id);
  let beforeEdit = null;
  el.addEventListener("focus", () => {
    beforeEdit = copyCover(cover);
  });
  el.addEventListener("input", () => {
    cover[key] = el.value;
    draw();
  });
  el.addEventListener("change", () => {
    if (beforeEdit) {
      past.push(beforeEdit);
      if (past.length > 60) past.shift();
      future = [];
      beforeEdit = null;
      syncHistoryButtons();
    }
  });
}
bindText("in-title", "title");
bindText("in-subtitle", "subtitle");
bindText("in-badge", "badge");

function bindCheck(id, key) {
  $(id).addEventListener("change", (ev) => {
    remember();
    cover[key] = ev.target.checked;
    draw();
  });
}
bindCheck("ck-grain", "grain");
bindCheck("ck-vignette", "vignette");
bindCheck("ck-frame", "frame");
bindCheck("ck-halftone", "halftone");

$("btn-undo").addEventListener("click", undo);
$("btn-redo").addEventListener("click", redo);
$("btn-shuffle").addEventListener("click", () => {
  remember();
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  cover.layout = pick(LAYOUTS).id;
  cover.grade = pick(GRADES).id;
  cover.titleStyle = pick(TITLE_STYLES).id;
  cover.selected = 0;
  fillPanels(cover);
  draw();
});
$("btn-reset").addEventListener("click", () => {
  remember();
  const keep = cover.photos;
  const next = fillPanels(freshCover());
  next.photos = keep;
  Object.keys(cover).forEach((k) => delete cover[k]);
  Object.assign(cover, next);
  draw();
});
$("btn-samples").addEventListener("click", async () => {
  remember();
  cover.photos = SAMPLES.map((s) => ({ id: s.id, name: s.name, src: s.src }));
  await loadAllPhotos();
  fillPanels(cover);
  cover.selected = 0;
  buildTray();
  draw();
});

function zoomSelected(f) {
  if (cover.selected < 0) return;
  remember();
  const slot = cover.panels[cover.layout][cover.selected];
  slot.zoom = Math.min(4, Math.max(1, slot.zoom * f));
  draw();
}
$("zoom-in").addEventListener("click", () => zoomSelected(1.25));
$("zoom-out").addEventListener("click", () => zoomSelected(1 / 1.25));
$("recenter").addEventListener("click", () => {
  if (cover.selected < 0) return;
  remember();
  const slot = cover.panels[cover.layout][cover.selected];
  slot.zoom = 1;
  slot.ox = 0;
  slot.oy = 0;
  draw();
});

$("file-input").addEventListener("change", async (ev) => {
  const files = [...ev.target.files].filter((f) => f.type.startsWith("image/"));
  if (!files.length) return;
  remember();
  for (const file of files) {
    const src = await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.readAsDataURL(file);
    });
    const id = `up${++uploadCount}`;
    cover.photos.push({ id, name: file.name.replace(/\.[^.]+$/, ""), src });
    await loadPhoto(cover.photos[cover.photos.length - 1]);
    const slots = cover.panels[cover.layout];
    if (cover.selected >= 0 && slots[cover.selected]) {
      slots[cover.selected].photo = cover.photos.length - 1;
    }
  }
  fillPanels(cover);
  buildTray();
  draw();
  ev.target.value = "";
});

$("btn-download").addEventListener("click", () => {
  const size = SIZES.find((s) => s.id === cover.size) || SIZES[0];
  const off = document.createElement("canvas");
  paintCover(off, cover, photos);
  off.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `neon-boulevard-${size.id}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, "image/png");
});

document.addEventListener("keydown", (ev) => {
  if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "z") {
    ev.preventDefault();
    if (ev.shiftKey) redo();
    else undo();
  } else if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "y") {
    ev.preventDefault();
    redo();
  }
});

async function start() {
  if (query.get("layout")) cover.layout = query.get("layout");
  if (query.get("grade")) cover.grade = query.get("grade");
  if (query.get("size")) cover.size = query.get("size");
  if (query.get("title")) cover.title = query.get("title");
  if (query.get("subtitle")) cover.subtitle = query.get("subtitle");
  if (shotMode === "cover") {
    document.body.classList.add("shot-cover");
    if (!query.get("size")) cover.size = "1080x1350";
  }
  fillPanels(cover);
  buildTray();
  await loadAllPhotos();
  draw();
  window.__press = { cover, photos, draw, paintCover };
}

start();
