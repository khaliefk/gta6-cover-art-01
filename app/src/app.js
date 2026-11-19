// Neon Boulevard Press: the editor. Wires the controls to the painter,
// loads photos, and handles panel clicks, drags, zoom and export.

import {
  SAMPLES,
  SIZES,
  TITLE_STYLES,
  LAYOUTS,
  GRADES,
  freshCover,
  fillSlots,
  copyCover,
  findLayout,
} from "./catalog.js";
import { renderCover, panelAt } from "./render.js";

const cover = fillSlots(freshCover());
const photos = new Map();
const params = new URLSearchParams(location.search);
const shotMode = params.get("shot");
const canvas = document.getElementById("stage");
const tray = document.getElementById("tray");

// History is a list of snapshots plus an index. Undo and redo move the
// index. A new edit drops everything after the index and appends.
let history = [JSON.stringify(cover)];
let hi = 0;
let uploads = 0;
let drag = null;

const $ = (id) => document.getElementById(id);

function snap() {
  return JSON.stringify(cover);
}

function applySnapshot(json) {
  const keep = cover.photos;
  const next = JSON.parse(json);
  next.photos = keep;
  for (const k of Object.keys(cover)) delete cover[k];
  Object.assign(cover, next);
  fillSlots(cover);
}

function commit() {
  history = history.slice(0, hi + 1);
  history.push(snap());
  if (history.length > 61) history.shift();
  hi = history.length - 1;
  syncHistory();
}

function undo() {
  if (hi <= 0) return;
  hi--;
  applySnapshot(history[hi]);
  draw();
  syncHistory();
}

function redo() {
  if (hi >= history.length - 1) return;
  hi++;
  applySnapshot(history[hi]);
  draw();
  syncHistory();
}

function syncHistory() {
  $("btn-back").disabled = hi <= 0;
  $("btn-forward").disabled = hi >= history.length - 1;
}

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

function draw() {
  renderCover(canvas, cover, photos);
  drawSelection();
  refreshChips();
  refreshPanelInfo();
}

function drawSelection() {
  if (shotMode === "cover" || cover.selected < 0) return;
  const panel = findLayout(cover.layout).panels[cover.selected];
  if (!panel) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  ctx.save();
  ctx.strokeStyle = "#2dd4bf";
  ctx.lineWidth = Math.max(3, W * 0.006);
  ctx.setLineDash([14, 8]);
  ctx.strokeRect(panel[0] * W + 2, panel[1] * H + 2, panel[2] * W - 4, panel[3] * H - 4);
  ctx.restore();
}

// Chips are built once. Clicks are delegated: one listener per group
// reads the button's data-value and runs the group's setter.
function buildChips(el, items, current, onPick) {
  el.textContent = "";
  for (const item of items) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = item.name;
    b.dataset.value = item.id;
    if (item.id === current) b.classList.add("active");
    el.appendChild(b);
  }
  if (!el.dataset.wired) {
    el.dataset.wired = "1";
    el.addEventListener("click", (ev) => {
      const b = ev.target.closest("button");
      if (!b) return;
      onPick(b.dataset.value);
    });
  }
}

function refreshChips() {
  buildChips($("layouts"), LAYOUTS, cover.layout, (id) => {
    if (id === cover.layout) return;
    cover.layout = id;
    cover.selected = 0;
    commit();
    draw();
  });
  buildChips($("grades"), GRADES, cover.grade, (id) => {
    if (id === cover.grade) return;
    cover.grade = id;
    commit();
    draw();
  });
  buildChips($("title-styles"), TITLE_STYLES, cover.titleStyle, (id) => {
    if (id === cover.titleStyle) return;
    cover.titleStyle = id;
    commit();
    draw();
  });
  buildChips($("sizes"), SIZES, cover.size, (id) => {
    if (id === cover.size) return;
    cover.size = id;
    commit();
    draw();
  });
}

function refreshPanelInfo() {
  $("in-title").value = cover.title;
  $("in-subtitle").value = cover.subtitle;
  $("in-badge").value = cover.badge;
  $("ck-grain").checked = cover.grain;
  $("ck-vignette").checked = cover.vignette;
  $("ck-frame").checked = cover.frame;
  $("ck-halftone").checked = cover.halftone;
  const layout = findLayout(cover.layout);
  const slot = (cover.slots[cover.layout] || [])[cover.selected];
  const label = $("panel-info");
  if (cover.selected < 0 || !slot) {
    label.textContent = "Nothing selected yet. Click a panel on the cover.";
  } else {
    const photo = cover.photos[slot.photo];
    label.textContent = `Panel ${cover.selected + 1} of ${layout.panels.length}. Photo: ${photo ? photo.name : "none"}. Zoom ${slot.zoom.toFixed(2)}x.`;
  }
  for (const img of tray.querySelectorAll("img")) {
    img.classList.toggle("picked", !!slot && Number(img.dataset.photo) === slot.photo);
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
    tray.appendChild(img);
  });
}

tray.addEventListener("click", (ev) => {
  const img = ev.target.closest("img");
  if (!img) return;
  if (cover.selected < 0) cover.selected = 0;
  const slots = cover.slots[cover.layout];
  if (slots[cover.selected]) slots[cover.selected].photo = Number(img.dataset.photo);
  commit();
  draw();
});

function canvasPoint(ev) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((ev.clientX - rect.left) / rect.width) * canvas.width,
    y: ((ev.clientY - rect.top) / rect.height) * canvas.height,
  };
}

function slotOf(idx) {
  return cover.slots[cover.layout][idx];
}

canvas.addEventListener("pointerdown", (ev) => {
  if (shotMode === "cover") return;
  const pt = canvasPoint(ev);
  const idx = panelAt(cover, pt.x, pt.y, canvas.width, canvas.height);
  if (idx < 0) return;
  cover.selected = idx;
  const panel = findLayout(cover.layout).panels[idx];
  drag = {
    idx,
    startX: pt.x,
    startY: pt.y,
    moved: false,
    before: snap(),
    pw: panel[2] * canvas.width,
    ph: panel[3] * canvas.height,
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
  const slot = slotOf(drag.idx);
  slot.ox += dx / drag.pw;
  slot.oy += dy / drag.ph;
  drag.startX = pt.x;
  drag.startY = pt.y;
  draw();
});

canvas.addEventListener("pointerup", () => {
  if (!drag) return;
  // A drag writes many small moves. Keep one history entry for the whole drag.
  if (drag.moved) {
    history = history.slice(0, hi + 1);
    history.push(drag.before);
    history.push(snap());
    if (history.length > 61) history.splice(0, history.length - 61);
    hi = history.length - 1;
    syncHistory();
  }
  drag = null;
});

canvas.addEventListener(
  "wheel",
  (ev) => {
    if (shotMode === "cover") return;
    ev.preventDefault();
    const pt = canvasPoint(ev);
    const idx = panelAt(cover, pt.x, pt.y, canvas.width, canvas.height);
    if (idx < 0) return;
    const slot = slotOf(idx);
    slot.zoom = Math.min(4, Math.max(1, slot.zoom * (ev.deltaY < 0 ? 1.12 : 1 / 1.12)));
    cover.selected = idx;
    commit();
    draw();
  },
  { passive: false }
);

// Text fields commit once, when the edit is done, so typing stays smooth.
function wireText(id, key) {
  const el = $(id);
  let before = null;
  el.addEventListener("focus", () => {
    before = snap();
  });
  el.addEventListener("input", () => {
    cover[key] = el.value;
    draw();
  });
  el.addEventListener("change", () => {
    if (before === null || before === snap()) return;
    history = history.slice(0, hi + 1);
    history.push(before);
    history.push(snap());
    if (history.length > 61) history.splice(0, history.length - 61);
    hi = history.length - 1;
    before = null;
    syncHistory();
  });
}
wireText("in-title", "title");
wireText("in-subtitle", "subtitle");
wireText("in-badge", "badge");

function wireCheck(id, key) {
  $(id).addEventListener("change", (ev) => {
    cover[key] = ev.target.checked;
    commit();
    draw();
  });
}
wireCheck("ck-grain", "grain");
wireCheck("ck-vignette", "vignette");
wireCheck("ck-frame", "frame");
wireCheck("ck-halftone", "halftone");

$("btn-back").addEventListener("click", undo);
$("btn-forward").addEventListener("click", redo);

$("btn-mix").addEventListener("click", () => {
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  cover.layout = pick(LAYOUTS).id;
  cover.grade = pick(GRADES).id;
  cover.titleStyle = pick(TITLE_STYLES).id;
  cover.selected = 0;
  fillSlots(cover);
  commit();
  draw();
});

$("btn-clear").addEventListener("click", () => {
  const keep = cover.photos;
  const next = fillSlots(freshCover());
  next.photos = keep;
  for (const k of Object.keys(cover)) delete cover[k];
  Object.assign(cover, next);
  commit();
  draw();
});

$("btn-load-samples").addEventListener("click", async () => {
  cover.photos = SAMPLES.map((s) => ({ id: s.id, name: s.name, src: s.src }));
  await Promise.all(cover.photos.map(loadPhoto));
  fillSlots(cover);
  cover.selected = 0;
  buildTray();
  commit();
  draw();
});

function zoomSelected(factor) {
  if (cover.selected < 0) return;
  const slot = slotOf(cover.selected);
  slot.zoom = Math.min(4, Math.max(1, slot.zoom * factor));
  commit();
  draw();
}
$("zoom-in").addEventListener("click", () => zoomSelected(1.25));
$("zoom-out").addEventListener("click", () => zoomSelected(1 / 1.25));
$("zoom-reset").addEventListener("click", () => {
  if (cover.selected < 0) return;
  const slot = slotOf(cover.selected);
  slot.zoom = 1;
  slot.ox = 0;
  slot.oy = 0;
  commit();
  draw();
});

$("file-pick").addEventListener("change", async (ev) => {
  const picked = [...ev.target.files].filter((f) => f.type.startsWith("image/"));
  ev.target.value = "";
  if (!picked.length) return;
  for (const file of picked) {
    const id = `up${++uploads}`;
    const name = file.name.replace(/\.[^.]+$/, "") || "photo";
    const src = URL.createObjectURL(file);
    cover.photos.push({ id, name, src });
    await loadPhoto(cover.photos[cover.photos.length - 1]);
    const slots = cover.slots[cover.layout];
    if (cover.selected >= 0 && slots[cover.selected]) {
      slots[cover.selected].photo = cover.photos.length - 1;
    }
  }
  fillSlots(cover);
  buildTray();
  commit();
  draw();
});

$("btn-save").addEventListener("click", () => {
  const size = SIZES.find((s) => s.id === cover.size) || SIZES[0];
  const off = document.createElement("canvas");
  renderCover(off, cover, photos);
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
  if (!(ev.ctrlKey || ev.metaKey)) return;
  const key = ev.key.toLowerCase();
  if (key === "z" && !ev.shiftKey) {
    ev.preventDefault();
    undo();
  } else if ((key === "z" && ev.shiftKey) || key === "y") {
    ev.preventDefault();
    redo();
  }
});

async function start() {
  const layout = params.get("layout");
  const grade = params.get("grade");
  const size = params.get("size");
  if (layout) cover.layout = layout;
  if (grade) cover.grade = grade;
  if (size) cover.size = size;
  if (params.get("title")) cover.title = params.get("title");
  if (params.get("subtitle")) cover.subtitle = params.get("subtitle");
  if (shotMode === "cover") {
    document.body.classList.add("shot-cover");
    if (!size) cover.size = "1080x1350";
  }
  fillSlots(cover);
  buildTray();
  await Promise.all(cover.photos.map(loadPhoto));
  history = [snap()];
  hi = 0;
  draw();
  window.__press = { cover, photos, draw, renderCover };
}

start();
