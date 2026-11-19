// Neon Boulevard Press: the editor.
//
// Wires the page to the painter. Click a panel to pick it, click a
// photo in the tray to fill it. Drag inside a panel to slide the
// photo, scroll to zoom it. Every change goes through one history
// stack, so Undo and Redo cover the lot. Shuffle rolls a fresh
// combination from the layouts, grades, and samples. Export paints
// the cover on an offscreen canvas at the chosen size and downloads
// a real PNG.
//
// window.__press exposes the live state for the shot scenes and the
// verification driver: state, the loaded photo map, and the setters.

import { GRADES, LAYOUTS, SAMPLES, SIZES, TITLE_STYLES, findLayout, findSize, freshState } from "./data.js";
import { drawCover, hitPanel } from "./painter.js";
import { runShot } from "./shots.js";

const $ = (id) => document.getElementById(id);
const canvas = $("cover");
const status = $("status");

const state = freshState();
const photos = new Map();
let undoStack = [];
let redoStack = [];
let drag = null;

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

async function loadSamples() {
  for (const s of SAMPLES) {
    try {
      photos.set(s.id, await loadImage(s.src));
    } catch {
      // A missing sample leaves its panels dark instead of breaking the page.
    }
  }
}

function snapshot() {
  return JSON.stringify(state);
}

function restore(json) {
  const next = JSON.parse(json);
  Object.keys(state).forEach((k) => delete state[k]);
  Object.assign(state, next);
  syncControls();
  paint();
}

function commit() {
  undoStack.push(snapshot());
  if (undoStack.length > 60) undoStack.shift();
  redoStack = [];
  paint();
}

function undo() {
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  restore(undoStack.pop());
  say("Undid that change.");
}

function redo() {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  restore(redoStack.pop());
  say("Redid that change.");
}

function say(msg) {
  status.textContent = msg;
}

function paint() {
  drawCover(canvas, state, photos);
}

function panelCount() {
  return findLayout(state.layout).panels.length;
}

function keepPanelsInRange() {
  while (state.panels.length < panelCount()) {
    state.panels.push({ photo: SAMPLES[0].id, px: 0, py: 0, zoom: 1 });
  }
  if (state.selected >= panelCount()) state.selected = 0;
}

function setLayout(id) {
  state.layout = id;
  keepPanelsInRange();
}

function setGrade(id) {
  state.grade = id;
}

function setSize(id) {
  state.size = id;
  const s = findSize(id);
  canvas.width = s.w;
  canvas.height = s.h;
}

function setTitle(text) {
  state.title = text;
}

function fillAll(photoId) {
  state.panels.forEach((p) => {
    p.photo = photoId;
    p.px = 0;
    p.py = 0;
    p.zoom = 1;
  });
}

function shuffle() {
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  commit();
  setLayout(pick(LAYOUTS).id);
  setGrade(pick(GRADES).id);
  state.titleStyle = pick(TITLE_STYLES).id;
  state.panels.forEach((p, i) => {
    p.photo = pick(SAMPLES).id;
    p.px = (Math.random() - 0.5) * 0.3;
    p.py = (Math.random() - 0.5) * 0.3;
    p.zoom = 1 + Math.random() * 0.5;
  });
  syncControls();
  paint();
  say("Shuffled a fresh cover. Undo brings the old one back.");
}

function buildTray() {
  const tray = $("tray");
  tray.innerHTML = "";
  for (const s of SAMPLES) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "thumb";
    btn.dataset.photo = s.id;
    const img = document.createElement("img");
    img.src = s.src;
    img.alt = s.name;
    const cap = document.createElement("span");
    cap.textContent = s.name;
    btn.append(img, cap);
    btn.addEventListener("click", () => {
      commit();
      state.panels[state.selected].photo = s.id;
      state.panels[state.selected].px = 0;
      state.panels[state.selected].py = 0;
      state.panels[state.selected].zoom = 1;
      paint();
      say(`${s.name} is in panel ${state.selected + 1}.`);
    });
    tray.append(btn);
  }
  const up = document.createElement("label");
  up.className = "thumb upload";
  up.innerHTML = "<span>Add your photo</span><input id=\"upload\" type=\"file\" accept=\"image/*\">";
  tray.append(up);
  up.querySelector("input").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      const id = `up-${Date.now()}`;
      photos.set(id, img);
      commit();
      state.panels[state.selected].photo = id;
      state.panels[state.selected].px = 0;
      state.panels[state.selected].py = 0;
      state.panels[state.selected].zoom = 1;
      paint();
      say("Your photo is in the selected panel.");
    } catch {
      say("That file did not load as a photo.");
    }
  });
}

function buildPickers() {
  const layouts = $("layouts");
  layouts.innerHTML = "";
  for (const l of LAYOUTS) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = l.label;
    b.dataset.layout = l.id;
    b.addEventListener("click", () => {
      commit();
      setLayout(l.id);
      syncControls();
      paint();
    });
    layouts.append(b);
  }
  const grades = $("grades");
  grades.innerHTML = "";
  for (const g of GRADES) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = g.label;
    b.dataset.grade = g.id;
    b.addEventListener("click", () => {
      commit();
      setGrade(g.id);
      syncControls();
      paint();
    });
    grades.append(b);
  }
  const styles = $("title-styles");
  styles.innerHTML = "";
  for (const t of TITLE_STYLES) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = t.label;
    b.dataset.style = t.id;
    b.addEventListener("click", () => {
      commit();
      state.titleStyle = t.id;
      syncControls();
      paint();
    });
    styles.append(b);
  }
  const sizes = $("size");
  sizes.innerHTML = "";
  for (const s of SIZES) {
    const o = document.createElement("option");
    o.value = s.id;
    o.textContent = `${s.label} ${s.w} x ${s.h}`;
    sizes.append(o);
  }
  sizes.addEventListener("change", () => {
    commit();
    setSize(sizes.value);
    paint();
  });
}

function syncControls() {
  document.querySelectorAll("#layouts button").forEach((b) =>
    b.classList.toggle("on", b.dataset.layout === state.layout));
  document.querySelectorAll("#grades button").forEach((b) =>
    b.classList.toggle("on", b.dataset.grade === state.grade));
  document.querySelectorAll("#title-styles button").forEach((b) =>
    b.classList.toggle("on", b.dataset.style === state.titleStyle));
  $("title").value = state.title;
  $("subtitle").value = state.subtitle;
  $("badge").value = state.badge;
  $("grain").checked = state.grain;
  $("vignette").checked = state.vignette;
  $("halftone").checked = state.halftone;
  $("size").value = state.size;
  const s = findSize(state.size);
  canvas.width = s.w;
  canvas.height = s.h;
}

function exportPng() {
  const s = findSize(state.size);
  const off = document.createElement("canvas");
  off.width = s.w;
  off.height = s.h;
  drawCover(off, state, photos);
  off.toBlob((blob) => {
    if (!blob) {
      say("Export failed. Try again.");
      return;
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `neon-boulevard-${s.w}x${s.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    say(`Saved neon-boulevard-${s.w}x${s.h}.png.`);
  }, "image/png");
}

function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * canvas.width,
    y: ((e.clientY - r.top) / r.height) * canvas.height,
  };
}

canvas.addEventListener("pointerdown", (e) => {
  const p = canvasPoint(e);
  const hit = hitPanel(findLayout(state.layout), canvas.width, canvas.height, p.x, p.y);
  if (hit < 0) return;
  state.selected = hit;
  canvas.setPointerCapture(e.pointerId);
  drag = { x: p.x, y: p.y, moved: false, before: snapshot() };
});

canvas.addEventListener("pointermove", (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const pan = state.panels[state.selected];
  if (!pan) return;
  pan.px += (p.x - drag.x) / canvas.width;
  pan.py += (p.y - drag.y) / canvas.height;
  drag.x = p.x;
  drag.y = p.y;
  drag.moved = true;
  paint();
});

canvas.addEventListener("pointerup", () => {
  if (drag && drag.moved) {
    undoStack.push(drag.before);
    if (undoStack.length > 60) undoStack.shift();
    redoStack = [];
  }
  drag = null;
  paint();
});

canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  const pan = state.panels[state.selected];
  if (!pan) return;
  const before = snapshot();
  pan.zoom = Math.min(3, Math.max(0.6, pan.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
  undoStack.push(before);
  if (undoStack.length > 60) undoStack.shift();
  redoStack = [];
  paint();
}, { passive: false });

$("title").addEventListener("input", (e) => { state.title = e.target.value; paint(); });
$("subtitle").addEventListener("input", (e) => { state.subtitle = e.target.value; paint(); });
$("badge").addEventListener("input", (e) => { state.badge = e.target.value; paint(); });
$("grain").addEventListener("change", (e) => { commit(); state.grain = e.target.checked; paint(); });
$("vignette").addEventListener("change", (e) => { commit(); state.vignette = e.target.checked; paint(); });
$("halftone").addEventListener("change", (e) => { commit(); state.halftone = e.target.checked; paint(); });
$("btn-undo").addEventListener("click", undo);
$("btn-redo").addEventListener("click", redo);
$("btn-shuffle").addEventListener("click", shuffle);
$("btn-export").addEventListener("click", exportPng);

window.__press = {
  state,
  photos,
  canvas,
  paint,
  setLayout,
  setGrade,
  setSize,
  setTitle,
  fillAll,
  ready: async () => {
    await loadSamples();
    paint();
  },
};

buildTray();
buildPickers();
syncControls();
await loadSamples();
paint();

const shot = new URLSearchParams(location.search).get("shot");
if (shot) {
  await runShot(window.__press);
}
