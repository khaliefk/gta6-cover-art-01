// Vice Lights Press bootstrap: wires the controls to the editor, handles
// photo upload and PNG export, and renders the ?shot= screenshot scenes.

import { createEditor, fitPanels, SAMPLE_IDS } from './editor.js';
import { LAYOUTS, GRADES, TITLE_STYLES, EXPORT_SIZES, sizeDef, exportCover, renderCover } from './cover.js';
import { SCENE_LABELS } from './scenes.js';

const $ = (id) => document.getElementById(id);
const preview = $('preview');
let editor = null;
let state = null;

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const uploads = [];

function photoOptions() {
  const opts = SAMPLE_IDS.map((id) => ({ id, label: `Sample · ${SCENE_LABELS[id]}` }));
  for (const u of uploads) opts.push({ id: u.id, label: `Upload · ${u.name}` });
  return opts;
}

function buildButtons(container, items, current, onPick) {
  container.replaceChildren();
  for (const item of items) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = item.label;
    if (item.id === current) btn.classList.add('active');
    btn.addEventListener('click', () => onPick(item.id));
    container.appendChild(btn);
  }
}

function buildPanelRows() {
  const box = $('panelRows');
  box.replaceChildren();
  state.panels.forEach((panel, i) => {
    const row = document.createElement('div');
    row.className = 'panelRow';
    const name = document.createElement('div');
    name.className = 'pname';
    name.innerHTML = `Panel ${i + 1}<small>${editor.selected === i ? 'selected' : 'click preview'}</small>`;
    const col = document.createElement('div');
    const sel = document.createElement('select');
    sel.setAttribute('aria-label', `Photo for panel ${i + 1}`);
    for (const opt of photoOptions()) {
      const o = document.createElement('option');
      o.value = opt.id;
      o.textContent = opt.label;
      if (opt.id === panel.photo) o.selected = true;
      sel.appendChild(o);
    }
    sel.addEventListener('change', () => {
      editor.selectPanel(i);
      editor.setPanel(i, { photo: sel.value });
    });
    const zoom = document.createElement('input');
    zoom.type = 'range';
    zoom.min = '1';
    zoom.max = '3';
    zoom.step = '0.05';
    zoom.value = String(panel.zoom || 1);
    zoom.setAttribute('aria-label', `Zoom for panel ${i + 1}`);
    zoom.addEventListener('input', () => {
      // Mutate directly and repaint: going through setPanel would rebuild
      // this very slider mid-drag.
      state.panels[i].zoom = Number(zoom.value);
      editor.drawPreview();
    });
    zoom.addEventListener('change', () => editor.setPanel(i, { zoom: Number(zoom.value) }));
    col.appendChild(sel);
    col.appendChild(zoom);
    row.appendChild(name);
    row.appendChild(col);
    box.appendChild(row);
  });
}

function syncControls() {
  buildButtons($('layoutBtns'), LAYOUTS, state.layout, (id) => editor.set({ layout: id }));
  buildButtons($('gradeBtns'), GRADES, state.grade, (id) => editor.set({ grade: id }));
  buildButtons($('titleBtns'), TITLE_STYLES, state.titleStyle, (id) => editor.set({ titleStyle: id }));
  $('titleInput').value = state.title;
  $('subtitleInput').value = state.subtitle;
  $('badgeInput').value = state.badge;
  $('heatInput').value = String(state.heat);
  $('heatStars').textContent = '★'.repeat(state.heat) + '☆'.repeat(5 - state.heat);
  $('sizeSelect').value = state.size;
  $('undoBtn').disabled = !editor.canUndo();
  $('redoBtn').disabled = !editor.canRedo();
  buildPanelRows();
}

function sizePreview() {
  const size = sizeDef(state.size);
  const scale = Math.min(640 / size.w, 640 / size.h);
  preview.width = Math.round(size.w * scale);
  preview.height = Math.round(size.h * scale);
}

function redraw() {
  syncControls();
  sizePreview();
  editor.drawPreview();
}

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

async function doExport(sizeId) {
  const note = $('exportNote');
  const size = sizeDef(sizeId || state.size);
  note.textContent = `Rendering ${size.label}…`;
  const blob = await exportCover({ ...state, size: size.id }, editor.photos);
  if (!blob) {
    note.textContent = 'Export failed in this browser.';
    return;
  }
  const safe = (state.title || 'cover').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  download(blob, `vice-lights-${safe}-${size.id}.png`);
  note.textContent = `Saved ${size.label} PNG.`;
}

function applyParams() {
  const pick = (key, list) => {
    const v = params.get(key);
    return list.some((x) => x.id === v) ? v : null;
  };
  const layout = pick('layout', LAYOUTS);
  const grade = pick('grade', GRADES);
  const titleStyle = pick('title', TITLE_STYLES);
  const size = pick('size', EXPORT_SIZES);
  const photo = params.get('photo');
  const title = params.get('caption');
  const patch = {};
  if (layout) patch.layout = layout;
  if (grade) patch.grade = grade;
  if (titleStyle) patch.titleStyle = titleStyle;
  if (size) patch.size = size;
  if (title) patch.title = title.slice(0, 24);
  editor.set(patch, false);
  fitPanels(state);
  if (photo && (SAMPLE_IDS.includes(photo) || editor.photos[photo])) {
    state.panels.forEach((p, i) => {
      p.photo = photo;
    });
  }
}

async function ensureFonts() {
  try {
    await Promise.all([
      document.fonts.load('900 100px "Liberation Sans"'),
      document.fonts.load('400 16px "Liberation Sans"'),
      document.fonts.load('italic 900 100px "Liberation Serif"'),
    ]);
    await document.fonts.ready;
  } catch (e) {
    /* Fallback fonts still render; the cover stays usable. */
  }
}

function wire() {
  $('titleInput').addEventListener('input', (ev) => editor.set({ title: ev.target.value }, false));
  $('titleInput').addEventListener('change', (ev) => editor.set({ title: ev.target.value }));
  $('subtitleInput').addEventListener('input', (ev) => editor.set({ subtitle: ev.target.value }, false));
  $('subtitleInput').addEventListener('change', (ev) => editor.set({ subtitle: ev.target.value }));
  $('badgeInput').addEventListener('input', (ev) => editor.set({ badge: ev.target.value }, false));
  $('badgeInput').addEventListener('change', (ev) => editor.set({ badge: ev.target.value }));
  $('heatInput').addEventListener('input', (ev) => {
    editor.set({ heat: Number(ev.target.value) }, false);
    $('heatStars').textContent = '★'.repeat(state.heat) + '☆'.repeat(5 - state.heat);
  });
  $('heatInput').addEventListener('change', (ev) => editor.set({ heat: Number(ev.target.value) }));
  $('sizeSelect').addEventListener('change', (ev) => {
    editor.set({ size: ev.target.value });
    redraw();
  });
  $('undoBtn').addEventListener('click', () => {
    editor.undo();
    redraw();
  });
  $('redoBtn').addEventListener('click', () => {
    editor.redo();
    redraw();
  });
  $('exportBtn').addEventListener('click', () => doExport());
  $('exportAllBtn').addEventListener('click', async () => {
    for (const s of EXPORT_SIZES) {
      // eslint-disable-next-line no-await-in-loop
      await doExport(s.id);
    }
  });
  $('uploadInput').addEventListener('change', async (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    try {
      const id = await editor.addUpload(file);
      uploads.push({ id, name: file.name });
      editor.setPanel(editor.selected, { photo: id });
      redraw();
    } catch (err) {
      $('exportNote').textContent = `Could not read that image: ${err.message}`;
    }
    ev.target.value = '';
  });
  document.addEventListener('keydown', (ev) => {
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'z') {
      ev.preventDefault();
      if (ev.shiftKey) editor.redo();
      else editor.undo();
      redraw();
    } else if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'y') {
      ev.preventDefault();
      editor.redo();
      redraw();
    }
  });
  editor.onChange(() => {
    syncControls();
    editor.drawPreview();
  });
  editor.attachPointer();
}

async function renderShotCover() {
  document.body.classList.add('shot-cover');
  const w = window.innerWidth;
  const h = window.innerHeight;
  preview.width = w;
  preview.height = h;
  await ensureFonts();
  renderCover(preview.getContext('2d'), state, editor.photos, w, h);
  document.title = 'shot:cover';
}

async function main() {
  // Fonts first: the sample scenes paint their neon signs with them.
  await ensureFonts();
  editor = createEditor(preview);
  state = editor.state;
  applyParams();
  wire();
  if (shot === 'cover') {
    await renderShotCover();
    return;
  }
  redraw();
  if (shot === 'editor') document.title = 'shot:editor';
}

main();
