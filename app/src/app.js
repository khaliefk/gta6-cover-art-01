// Neon Boulevard Press: the editor wiring.
//
// This module owns the controls, the photo list, undo and redo, the
// drag-to-pan canvas, shuffle, and PNG export. The painter in
// render.js owns every pixel. State lives in state.js.

import { GRADES, LAYOUTS, SAMPLES, SIZES, TITLE_STYLES, freshState, restore, snapshot } from "./state.js";
import { paint } from "./render.js";
import { applyShot } from "./shots.js";

const $ = (id) => document.getElementById(id);
const state = freshState();
const photos = [];
let undoStack = [];
let redoStack = [];
let readyResolve;
window.__ready = new Promise((r) => { readyResolve = r; });

const canvas = $("cover");
const ctx = canvas.getContext("2d");

function previewSize() {
  const s = SIZES[state.size];
  const scale = 900 / Math.max(s.w, s.h);
  return { w: Math.round(s.w * scale), h: Math.round(s.h * scale) };
}

function render() {
  const { w, h } = previewSize();
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const images = photos.map((p) => p.img);
  const coverShot = document.body.classList.contains("shot-cover");
  paint(ctx, w, h, state, images, { markSelected: !coverShot });
}

function commit() {
  undoStack.push(snapshot(state));
  if (undoStack.length > 60) undoStack.shift();
  redoStack = [];
  syncUndoButtons();
}

function syncUndoButtons() {
  $("undo").disabled = undoStack.length === 0;
  $("redo").disabled = redoStack.length === 0;
}

function undo() {
  if (!undoStack.length) return;
  redoStack.push(snapshot(state));
  restore(state, undoStack.pop());
  syncControls();
  render();
  syncUndoButtons();
}

function redo() {
  if (!redoStack.length) return;
  undoStack.push(snapshot(state));
  restore(state, redoStack.pop());
  syncControls();
  render();
  syncUndoButtons();
}

function shuffle() {
  commit();
  const layoutKeys = Object.keys(LAYOUTS);
  const gradeKeys = Object.keys(GRADES);
  const styleKeys = Object.keys(TITLE_STYLES);
  state.layout = layoutKeys[Math.floor(Math.random() * layoutKeys.length)];
  state.grade = gradeKeys[Math.floor(Math.random() * gradeKeys.length)];
  state.titleStyle = styleKeys[Math.floor(Math.random() * styleKeys.length)];
  const order = photos.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  state.panels.forEach((p, i) => {
    p.photo = order[i % order.length];
    p.zoom = 1 + Math.random() * 0.5;
    p.x = (Math.random() - 0.5) * 0.12;
    p.y = (Math.random() - 0.5) * 0.12;
  });
  syncControls();
  render();
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function addSample(id) {
  const sample = SAMPLES.find((s) => s.id === id);
  if (!sample) return;
  const img = await loadImage(sample.src);
  if (!img) return;
  photos.push({ name: sample.name, img });
  state.panels.forEach((p) => {
    if (p.photo >= photos.length - 1 && photos.length <= 3) p.photo = photos.length - 1;
  });
  buildPhotoStrip();
  render();
}

async function addUploads(files) {
  for (const file of files) {
    if (!file.type.startsWith("image/")) continue;
    const src = await new Promise((res) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result);
      reader.readAsDataURL(file);
    });
    const img = await loadImage(src);
    if (img) photos.push({ name: file.name.replace(/\.[^.]+$/, ""), img });
  }
  buildPhotoStrip();
  render();
}

function buildPhotoStrip() {
  const strip = $("photos");
  strip.innerHTML = "";
  photos.forEach((p, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "thumb";
    btn.textContent = p.name;
    btn.title = `Pakai ${p.name} di panel terpilih`;
    btn.addEventListener("click", () => {
      commit();
      state.panels[state.selected].photo = i;
      render();
    });
    strip.appendChild(btn);
  });
}

function buildPickers() {
  const layoutBox = $("layouts");
  for (const [key, def] of Object.entries(LAYOUTS)) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = def.label;
    btn.dataset.key = key;
    btn.addEventListener("click", () => {
      commit();
      state.layout = key;
      state.selected = 0;
      syncControls();
      render();
    });
    layoutBox.appendChild(btn);
  }
  const gradeBox = $("grades");
  for (const [key, def] of Object.entries(GRADES)) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = def.label;
    btn.dataset.key = key;
    btn.addEventListener("click", () => {
      commit();
      state.grade = key;
      syncControls();
      render();
    });
    gradeBox.appendChild(btn);
  }
  const styleBox = $("styles");
  for (const [key, label] of Object.entries(TITLE_STYLES)) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label;
    btn.dataset.key = key;
    btn.addEventListener("click", () => {
      commit();
      state.titleStyle = key;
      syncControls();
      render();
    });
    styleBox.appendChild(btn);
  }
  const sizeSel = $("size");
  for (const [key, def] of Object.entries(SIZES)) {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = def.label;
    sizeSel.appendChild(opt);
  }
}

function syncControls() {
  document.querySelectorAll("#layouts button").forEach((b) =>
    b.classList.toggle("on", b.dataset.key === state.layout));
  document.querySelectorAll("#grades button").forEach((b) =>
    b.classList.toggle("on", b.dataset.key === state.grade));
  document.querySelectorAll("#styles button").forEach((b) =>
    b.classList.toggle("on", b.dataset.key === state.titleStyle));
  $("title").value = state.title;
  $("subtitle").value = state.subtitle;
  $("ribbon").value = state.ribbon;
  $("size").value = state.size;
  $("grain").checked = state.grain;
  $("vignette").checked = state.vignette;
  $("halftone").checked = state.halftone;
  const panel = state.panels[state.selected];
  $("zoom").value = panel.zoom;
  $("panx").value = panel.x;
  $("pany").value = panel.y;
  $("panelLabel").textContent = `Panel ${state.selected + 1} dari ${LAYOUTS[state.layout].slots}`;
}

function bindControls() {
  $("title").addEventListener("input", (e) => { state.title = e.target.value; render(); });
  $("title").addEventListener("change", () => commit());
  $("subtitle").addEventListener("input", (e) => { state.subtitle = e.target.value; render(); });
  $("subtitle").addEventListener("change", () => commit());
  $("ribbon").addEventListener("input", (e) => { state.ribbon = e.target.value; render(); });
  $("ribbon").addEventListener("change", () => commit());
  $("size").addEventListener("change", (e) => {
    commit();
    state.size = e.target.value;
    render();
  });
  for (const [id, key] of [["grain", "grain"], ["vignette", "vignette"], ["halftone", "halftone"]]) {
    $(id).addEventListener("change", (e) => {
      commit();
      state[key] = e.target.checked;
      render();
    });
  }
  $("zoom").addEventListener("input", (e) => {
    state.panels[state.selected].zoom = Number(e.target.value);
    render();
  });
  $("zoom").addEventListener("change", () => commit());
  $("panx").addEventListener("input", (e) => {
    state.panels[state.selected].x = Number(e.target.value);
    render();
  });
  $("panx").addEventListener("change", () => commit());
  $("pany").addEventListener("input", (e) => {
    state.panels[state.selected].y = Number(e.target.value);
    render();
  });
  $("pany").addEventListener("change", () => commit());
  $("undo").addEventListener("click", undo);
  $("redo").addEventListener("click", redo);
  $("shuffle").addEventListener("click", shuffle);
  $("export").addEventListener("click", () => exportPNG(state.size));
  $("upload").addEventListener("change", (e) => addUploads([...e.target.files]));
  $("reset").addEventListener("click", () => {
    commit();
    const keep = state.panels;
    Object.assign(state, freshState());
    state.panels = keep;
    syncControls();
    render();
  });
}

function hitPanel(clientX, clientY) {
  const box = canvas.getBoundingClientRect();
  const px = (clientX - box.left) * (canvas.width / box.width);
  const py = (clientY - box.top) * (canvas.height / box.height);
  const rects = LAYOUTS[state.layout].rects();
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    if (px >= r.x * canvas.width && px <= (r.x + r.w) * canvas.width &&
        py >= r.y * canvas.height && py <= (r.y + r.h) * canvas.height) return i;
  }
  return -1;
}

function bindCanvas() {
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let moved = false;
  canvas.addEventListener("pointerdown", (e) => {
    const hit = hitPanel(e.clientX, e.clientY);
    if (hit < 0) return;
    commit();
    state.selected = hit;
    syncControls();
    render();
    dragging = true;
    moved = false;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const box = canvas.getBoundingClientRect();
    const panel = state.panels[state.selected];
    panel.x += ((e.clientX - lastX) / box.width) * 0.6;
    panel.y += ((e.clientY - lastY) / box.height) * 0.6;
    panel.x = Math.max(-0.5, Math.min(0.5, panel.x));
    panel.y = Math.max(-0.5, Math.min(0.5, panel.y));
    lastX = e.clientX;
    lastY = e.clientY;
    moved = true;
    syncControls();
    render();
  });
  canvas.addEventListener("pointerup", () => { dragging = false; });
  canvas.addEventListener("wheel", (e) => {
    const hit = hitPanel(e.clientX, e.clientY);
    if (hit < 0) return;
    e.preventDefault();
    commit();
    state.selected = hit;
    const panel = state.panels[hit];
    panel.zoom = Math.max(1, Math.min(3, panel.zoom - Math.sign(e.deltaY) * 0.12));
    syncControls();
    render();
  }, { passive: false });
}

function exportPNG(sizeKey) {
  const size = SIZES[sizeKey] || SIZES[state.size];
  const off = document.createElement("canvas");
  off.width = size.w;
  off.height = size.h;
  paint(off.getContext("2d"), size.w, size.h, state, photos.map((p) => p.img), {});
  return new Promise((resolve) => {
    off.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `neon-boulevard-${size.w}x${size.h}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      $("status").textContent = `PNG ${size.w} x ${size.h} terunduh.`;
      resolve({ w: size.w, h: size.h, bytes: blob.size });
    }, "image/png");
  });
}

async function boot() {
  buildPickers();
  bindControls();
  bindCanvas();
  syncControls();
  syncUndoButtons();
  for (const s of SAMPLES) {
    const img = await loadImage(s.src);
    if (img) photos.push({ name: s.name, img });
  }
  buildPhotoStrip();
  applyShot(state, { render, syncControls });
  render();
  readyResolve(true);
}

window.NBP = { state, render, exportPNG, undo, redo, shuffle, photos };

boot();
