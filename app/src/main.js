// Neon Boulevard Press: the editor. Wires the controls to the renderer,
// loads photos, and handles panel clicks, drags, zoom and export.

import { SAMPLES, SIZES, TITLE_STYLES, LAYOUTS, GRADES, freshState, ensureSlots, cloneState, layoutById } from "./state.js";
import { drawCover, panelAt } from "./render.js";

const state = ensureSlots(freshState());
const images = new Map();
const canvas = document.getElementById("stage");
const tray = document.getElementById("tray");
const params = new URLSearchParams(location.search);
const shotMode = params.get("shot");

let undoStack = [];
let redoStack = [];
let uploadCount = 0;
let drag = null;

const $ = (id) => document.getElementById(id);

function loadImage(photo) {
  return new Promise((resolve) => {
    if (images.has(photo.id)) return resolve(images.get(photo.id));
    const img = new Image();
    img.onload = () => {
      images.set(photo.id, img);
      resolve(img);
    };
    img.onerror = () => resolve(null);
    img.src = photo.src;
  });
}

async function loadAllPhotos() {
  await Promise.all(state.photos.map(loadImage));
}

function render() {
  drawCover(canvas, state, images);
  drawSelection();
  syncControls();
}

function drawSelection() {
  if (shotMode === "cover" || state.selected < 0) return;
  const layout = layoutById(state.layout);
  const p = layout.panels[state.selected];
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

function pushHistory() {
  undoStack.push(cloneState(state));
  if (undoStack.length > 60) undoStack.shift();
  redoStack = [];
  syncUndoButtons();
}

function applySnapshot(snap) {
  const keep = state.photos;
  const next = cloneState(snap);
  next.photos = keep;
  Object.keys(state).forEach((k) => delete state[k]);
  Object.assign(state, next);
  ensureSlots(state);
}

function undo() {
  if (!undoStack.length) return;
  redoStack.push(cloneState(state));
  applySnapshot(undoStack.pop());
  render();
  syncUndoButtons();
}

function redo() {
  if (!redoStack.length) return;
  undoStack.push(cloneState(state));
  applySnapshot(redoStack.pop());
  render();
  syncUndoButtons();
}

function syncUndoButtons() {
  $("btn-undo").disabled = undoStack.length === 0;
  $("btn-redo").disabled = redoStack.length === 0;
}

function chipButton(label, active, onClick) {
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
      chipButton(l.name, l.id === state.layout, () => {
        if (state.layout === l.id) return;
        pushHistory();
        state.layout = l.id;
        state.selected = 0;
        render();
      })
    );
  }
  const gradesEl = $("grades");
  gradesEl.textContent = "";
  for (const g of GRADES) {
    gradesEl.appendChild(
      chipButton(g.name, g.id === state.grade, () => {
        if (state.grade === g.id) return;
        pushHistory();
        state.grade = g.id;
        render();
      })
    );
  }
  const stylesEl = $("title-styles");
  stylesEl.textContent = "";
  for (const s of TITLE_STYLES) {
    stylesEl.appendChild(
      chipButton(s.name, s.id === state.titleStyle, () => {
        if (state.titleStyle === s.id) return;
        pushHistory();
        state.titleStyle = s.id;
        render();
      })
    );
  }
  const sizesEl = $("sizes");
  sizesEl.textContent = "";
  for (const s of SIZES) {
    sizesEl.appendChild(
      chipButton(s.name, s.id === state.size, () => {
        if (state.size === s.id) return;
        pushHistory();
        state.size = s.id;
        render();
      })
    );
  }
  $("in-title").value = state.title;
  $("in-subtitle").value = state.subtitle;
  $("in-badge").value = state.badge;
  $("ck-grain").checked = state.grain;
  $("ck-vignette").checked = state.vignette;
  $("ck-frame").checked = state.frame;
  $("ck-halftone").checked = state.halftone;
  const layout = layoutById(state.layout);
  const slot = (state.slots[state.layout] || [])[state.selected];
  $("panel-label").textContent =
    state.selected < 0 || !slot
      ? "No panel selected yet. Click any panel on the cover."
      : `Panel ${state.selected + 1} of ${layout.panels.length}. Photo: ${(state.photos[slot.photo] || {}).name || "none"}. Zoom ${slot.zoom.toFixed(2)}x.`;
  for (const img of tray.querySelectorAll("img")) {
    img.classList.toggle("picked", slot && Number(img.dataset.photo) === slot.photo);
  }
}

function buildTray() {
  tray.textContent = "";
  state.photos.forEach((photo, i) => {
    const img = document.createElement("img");
    img.src = photo.src;
    img.alt = photo.name;
    img.title = photo.name;
    img.dataset.photo = String(i);
    img.addEventListener("click", () => {
      if (state.selected < 0) state.selected = 0;
      pushHistory();
      const slots = state.slots[state.layout];
      if (slots[state.selected]) slots[state.selected].photo = i;
      render();
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
  const pt = canvasPoint(ev);
  const idx = panelAt(state, pt.x, pt.y, canvas.width, canvas.height);
  if (idx < 0) return;
  state.selected = idx;
  const layout = layoutById(state.layout);
  const p = layout.panels[idx];
  drag = { idx, startX: pt.x, startY: pt.y, moved: false, pw: p.w * canvas.width, ph: p.h * canvas.height };
  canvas.setPointerCapture(ev.pointerId);
  render();
});

canvas.addEventListener("pointermove", (ev) => {
  if (!drag) return;
  const pt = canvasPoint(ev);
  const dx = pt.x - drag.startX;
  const dy = pt.y - drag.startY;
  if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
  if (!drag.moved) return;
  const slot = state.slots[state.layout][drag.idx];
  slot.ox += dx / drag.pw;
  slot.oy += dy / drag.ph;
  drag.startX = pt.x;
  drag.startY = pt.y;
  render();
});

canvas.addEventListener("pointerup", (ev) => {
  if (!drag) return;
  if (drag.moved) pushHistorySnapshotOnDragEnd();
  drag = null;
});

// A drag writes many small moves. Keep one history entry for the whole drag.
let dragStartSnapshot = null;
canvas.addEventListener("pointerdown", () => {
  dragStartSnapshot = cloneState(state);
});
function pushHistorySnapshotOnDragEnd() {
  if (!dragStartSnapshot) return;
  undoStack.push(dragStartSnapshot);
  if (undoStack.length > 60) undoStack.shift();
  redoStack = [];
  dragStartSnapshot = null;
  syncUndoButtons();
}

canvas.addEventListener(
  "wheel",
  (ev) => {
    if (shotMode === "cover") return;
    ev.preventDefault();
    const pt = canvasPoint(ev);
    const idx = panelAt(state, pt.x, pt.y, canvas.width, canvas.height);
    if (idx < 0) return;
    pushHistory();
    const slot = state.slots[state.layout][idx];
    slot.zoom = Math.min(4, Math.max(1, slot.zoom * (ev.deltaY < 0 ? 1.12 : 1 / 1.12)));
    state.selected = idx;
    render();
  },
  { passive: false }
);

function bindText(id, key) {
  const el = $(id);
  let beforeEdit = null;
  el.addEventListener("focus", () => {
    beforeEdit = cloneState(state);
  });
  el.addEventListener("input", () => {
    state[key] = el.value;
    render();
  });
  el.addEventListener("change", () => {
    if (beforeEdit) {
      undoStack.push(beforeEdit);
      if (undoStack.length > 60) undoStack.shift();
      redoStack = [];
      beforeEdit = null;
      syncUndoButtons();
    }
  });
}
bindText("in-title", "title");
bindText("in-subtitle", "subtitle");
bindText("in-badge", "badge");

function bindCheck(id, key) {
  $(id).addEventListener("change", (ev) => {
    pushHistory();
    state[key] = ev.target.checked;
    render();
  });
}
bindCheck("ck-grain", "grain");
bindCheck("ck-vignette", "vignette");
bindCheck("ck-frame", "frame");
bindCheck("ck-halftone", "halftone");

$("btn-undo").addEventListener("click", undo);
$("btn-redo").addEventListener("click", redo);
$("btn-shuffle").addEventListener("click", () => {
  pushHistory();
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  state.layout = pick(LAYOUTS).id;
  state.grade = pick(GRADES).id;
  state.titleStyle = pick(TITLE_STYLES).id;
  state.selected = 0;
  ensureSlots(state);
  render();
});
$("btn-reset").addEventListener("click", () => {
  pushHistory();
  const keep = state.photos;
  const next = ensureSlots(freshState());
  next.photos = keep;
  Object.keys(state).forEach((k) => delete state[k]);
  Object.assign(state, next);
  render();
});
$("btn-samples").addEventListener("click", async () => {
  pushHistory();
  state.photos = SAMPLES.map((s) => ({ id: s.id, name: s.name, src: s.src }));
  await loadAllPhotos();
  ensureSlots(state);
  state.selected = 0;
  buildTray();
  render();
});

$("zoom-in").addEventListener("click", () => zoomSelected(1.25));
$("zoom-out").addEventListener("click", () => zoomSelected(1 / 1.25));
$("recenter").addEventListener("click", () => {
  if (state.selected < 0) return;
  pushHistory();
  const slot = state.slots[state.layout][state.selected];
  slot.zoom = 1;
  slot.ox = 0;
  slot.oy = 0;
  render();
});
function zoomSelected(f) {
  if (state.selected < 0) return;
  pushHistory();
  const slot = state.slots[state.layout][state.selected];
  slot.zoom = Math.min(4, Math.max(1, slot.zoom * f));
  render();
}

$("file-input").addEventListener("change", async (ev) => {
  const files = [...ev.target.files].filter((f) => f.type.startsWith("image/"));
  if (!files.length) return;
  pushHistory();
  for (const file of files) {
    const src = await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.readAsDataURL(file);
    });
    const id = `up${++uploadCount}`;
    state.photos.push({ id, name: file.name.replace(/\.[^.]+$/, ""), src });
    await loadImage(state.photos[state.photos.length - 1]);
    const slots = state.slots[state.layout];
    if (state.selected >= 0 && slots[state.selected]) slots[state.selected].photo = state.photos.length - 1;
  }
  ensureSlots(state);
  buildTray();
  render();
  ev.target.value = "";
});

$("btn-download").addEventListener("click", () => {
  const size = SIZES.find((s) => s.id === state.size) || SIZES[0];
  const off = document.createElement("canvas");
  drawCover(off, state, images);
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
  if (params.get("layout")) state.layout = params.get("layout");
  if (params.get("grade")) state.grade = params.get("grade");
  if (params.get("size")) state.size = params.get("size");
  if (params.get("title")) state.title = params.get("title");
  if (params.get("subtitle")) state.subtitle = params.get("subtitle");
  if (shotMode === "cover") {
    document.body.classList.add("shot-cover");
    if (!params.get("size")) state.size = "1080x1350";
  }
  ensureSlots(state);
  buildTray();
  await loadAllPhotos();
  render();
  window.__press = { state, images, render, drawCover };
}

start();
