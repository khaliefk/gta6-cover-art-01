// Neon Coast Cover Studio: wires the editor page.
// Photos stay on the machine (FileReader / object URLs, never uploaded).
// Every change pushes the old state onto the undo stack first.
import { drawCover, exportCover, defaultState, LAYOUTS, GRADES, SIZES } from './cover.js';
import { runShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const state = defaultState();
let photos = [null, null, null];
let photoNames = ['Boulevard', 'Rooftop', 'Neon Night'];
let selectedPanel = 4;
let undoStack = [];
let redoStack = [];
let lastRects = [];

function snapshot() {
  return JSON.stringify(state);
}
function pushUndo() {
  undoStack.push(snapshot());
  if (undoStack.length > 60) undoStack.shift();
  redoStack = [];
  refreshUndoButtons();
}
function restore(json) {
  const next = JSON.parse(json);
  Object.keys(next).forEach((k) => { state[k] = next[k]; });
  syncControls();
  redraw();
}
function refreshUndoButtons() {
  $('undo').disabled = undoStack.length === 0;
  $('redo').disabled = redoStack.length === 0;
}

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function redraw() {
  lastRects = drawCover(canvas, photos, state);
  $('panelLabel').textContent = `Panel ${selectedPanel + 1} of ${(LAYOUTS[state.layout] || LAYOUTS.grid9).panels}`;
}

function sizeCanvas() {
  const size = SIZES[state.size] || SIZES.square;
  const box = $('stage');
  const availW = Math.min(box.clientWidth - 8, 860);
  const availH = Math.min(window.innerHeight - 120, 760);
  const scale = Math.min(availW / size.w, availH / size.h, 1);
  canvas.style.width = `${Math.round(size.w * scale)}px`;
  canvas.style.height = `${Math.round(size.h * scale)}px`;
}

function syncControls() {
  $('title').value = state.title;
  $('subtitle').value = state.subtitle;
  $('badge').value = state.badge;
  $('stars').value = state.stars;
  $('starsOut').textContent = `${state.stars} / 5`;
  $('frame').checked = state.frame;
  $('grain').checked = state.grain;
  $('halftone').checked = state.halftone;
  const panel = state.panels[selectedPanel];
  $('zoom').value = panel.zoom;
  $('zoomOut').textContent = `${Math.round(panel.zoom * 100)}%`;
  $('panx').value = panel.ox;
  $('pany').value = panel.oy;
  document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('on', b.dataset.layout === state.layout));
  document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('on', b.dataset.grade === state.grade));
  document.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('on', b.dataset.size === state.size));
  document.querySelectorAll('[data-photo]').forEach((b) => b.classList.toggle('on', Number(b.dataset.photo) === panel.photo));
  sizeCanvas();
}

function buildButtons() {
  const layoutBox = $('layouts');
  Object.entries(LAYOUTS).forEach(([key, def]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.layout = key;
    b.textContent = def.name;
    b.title = def.blurb;
    b.addEventListener('click', () => {
      if (state.layout === key) return;
      pushUndo();
      state.layout = key;
      selectedPanel = 0;
      syncControls();
      redraw();
    });
    layoutBox.appendChild(b);
  });
  const gradeBox = $('grades');
  Object.entries(GRADES).forEach(([key, def]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.grade = key;
    b.textContent = def.name;
    b.style.setProperty('--sw', def.glow);
    b.addEventListener('click', () => {
      if (state.grade === key) return;
      pushUndo();
      state.grade = key;
      syncControls();
      redraw();
    });
    gradeBox.appendChild(b);
  });
  const sizeBox = $('sizes');
  Object.entries(SIZES).forEach(([key, def]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.size = key;
    b.textContent = def.name;
    b.addEventListener('click', () => {
      if (state.size === key) return;
      pushUndo();
      state.size = key;
      syncControls();
      redraw();
    });
    sizeBox.appendChild(b);
  });
  const photoBox = $('assignPhoto');
  photoNames.forEach((name, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.photo = String(i);
    b.textContent = name;
    b.addEventListener('click', () => {
      pushUndo();
      state.panels[selectedPanel].photo = i;
      syncControls();
      redraw();
    });
    photoBox.appendChild(b);
  });
}

function bindControls() {
  $('title').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
  $('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
  $('badge').addEventListener('input', (e) => { state.badge = e.target.value; redraw(); });
  $('stars').addEventListener('input', (e) => { state.stars = Number(e.target.value); $('starsOut').textContent = `${state.stars} / 5`; redraw(); });
  $('frame').addEventListener('change', (e) => { pushUndo(); state.frame = e.target.checked; redraw(); });
  $('grain').addEventListener('change', (e) => { pushUndo(); state.grain = e.target.checked; redraw(); });
  $('halftone').addEventListener('change', (e) => { pushUndo(); state.halftone = e.target.checked; redraw(); });
  $('zoom').addEventListener('input', (e) => {
    state.panels[selectedPanel].zoom = Number(e.target.value);
    $('zoomOut').textContent = `${Math.round(state.panels[selectedPanel].zoom * 100)}%`;
    redraw();
  });
  $('zoom').addEventListener('change', () => pushUndo());
  $('panx').addEventListener('input', (e) => { state.panels[selectedPanel].ox = Number(e.target.value); redraw(); });
  $('pany').addEventListener('input', (e) => { state.panels[selectedPanel].oy = Number(e.target.value); redraw(); });
  $('fillAll').addEventListener('click', () => {
    pushUndo();
    const p = state.panels[selectedPanel].photo;
    state.panels.forEach((panel) => { panel.photo = p; });
    redraw();
  });
  $('shuffle').addEventListener('click', () => {
    pushUndo();
    state.panels.forEach((panel) => { panel.photo = Math.floor(Math.random() * 3); });
    redraw();
  });
  $('undo').addEventListener('click', () => {
    if (!undoStack.length) return;
    redoStack.push(snapshot());
    restore(undoStack.pop());
    refreshUndoButtons();
  });
  $('redo').addEventListener('click', () => {
    if (!redoStack.length) return;
    undoStack.push(snapshot());
    restore(redoStack.pop());
    refreshUndoButtons();
  });
  $('photos').addEventListener('change', async (e) => {
    const files = [...e.target.files].slice(0, 3);
    for (let i = 0; i < files.length; i++) {
      photos[i] = await loadImage(URL.createObjectURL(files[i]));
      photoNames[i] = files[i].name.replace(/\.[^.]+$/, '').slice(0, 18) || `Photo ${i + 1}`;
    }
    const box = $('assignPhoto');
    box.innerHTML = '';
    photoNames.forEach((name, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.photo = String(i);
      b.textContent = name;
      b.addEventListener('click', () => {
        pushUndo();
        state.panels[selectedPanel].photo = i;
        syncControls();
        redraw();
      });
      box.appendChild(b);
    });
    syncControls();
    redraw();
    $('status').textContent = `${files.length} photo${files.length > 1 ? 's' : ''} loaded from this machine.`;
  });
  canvas.addEventListener('click', (e) => {
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * canvas.width;
    const y = ((e.clientY - r.top) / r.height) * canvas.height;
    const idx = lastRects.findIndex((rect) => x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h);
    if (idx >= 0) {
      selectedPanel = idx;
      syncControls();
      redraw();
      $('status').textContent = `Panel ${idx + 1} selected. Drag the zoom and pan sliders to frame it.`;
    }
  });
  canvas.addEventListener('pointerdown', (e) => {
    pushUndo();
    const startX = e.clientX;
    const startY = e.clientY;
    const panel = state.panels[selectedPanel];
    const ox0 = panel.ox;
    const oy0 = panel.oy;
    const move = (ev) => {
      const rect = canvas.getBoundingClientRect();
      panel.ox = ox0 + ((ev.clientX - startX) / rect.width) * 0.9;
      panel.oy = oy0 + ((ev.clientY - startY) / rect.height) * 0.9;
      $('panx').value = panel.ox;
      $('pany').value = panel.oy;
      redraw();
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  });
  $('export').addEventListener('click', async () => {
    const size = SIZES[state.size];
    $('status').textContent = `Exporting ${size.w} x ${size.h} PNG...`;
    const blob = await exportCover(photos, state, state.size);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-coast-cover-${size.w}x${size.h}.png`;
    a.click();
    $('status').textContent = `Saved neon-coast-cover-${size.w}x${size.h}.png`;
  });
  window.addEventListener('resize', sizeCanvas);
}

async function loadSamples() {
  const names = ['boulevard', 'rooftop', 'neon'];
  for (let i = 0; i < names.length; i++) {
    try {
      photos[i] = await loadImage(`samples/${names[i]}.jpg`);
    } catch {
      photos[i] = null;
    }
  }
}

async function boot() {
  buildButtons();
  bindControls();
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (shot) {
    await loadSamples();
    await document.fonts.ready;
    runShot(shot, params, { state, photos, redraw, syncControls, sizeCanvas });
    return;
  }
  await loadSamples();
  try {
    await document.fonts.load('90px Anton');
    await document.fonts.load('40px Pacifico');
  } catch { /* fall back to system fonts */ }
  syncControls();
  redraw();
  refreshUndoButtons();
}

boot();
