// Vice Lights Press: the editor.
// State, undo/redo, panel picking with crop controls, photo upload and PNG
// export. The preview canvas redraws from the same drawCoverArt the export
// path uses, so what you see is what the PNG holds.

import { LAYOUTS, GRADES, TITLE_STYLES, SIZES, drawCoverArt } from './cover.js';

export const SAMPLES = [
  { id: 'sunset', name: 'Sunset Blvd', file: 'samples/sunset.png' },
  { id: 'neon', name: 'Neon Street', file: 'samples/neon.png' },
  { id: 'pier', name: 'Pier Day', file: 'samples/pier.png' },
];

export function defaultArt() {
  return {
    layout: 'hero3',
    grade: 'sunset',
    titleStyle: 'halftone',
    caption: 'VICE LIGHTS',
    subtitle: 'Leonida after dark',
    badge: 'LEONIDA',
    heat: 4,
    size: '1080x1350',
    photos: [],
    panelPhoto: [0, 1, 2, 0, 1, 2, 0, 1, 2],
    selected: 0,
  };
}

/** Load an image element from a URL; resolves with the element. */
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export class Editor {
  constructor(canvas, onChange) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.art = defaultArt();
    this.history = [];
    this.future = [];
    this.onChange = onChange || (() => {});
    this.fitCanvas();
  }

  fitCanvas() {
    const size = SIZES.find((s) => s.id === this.art.size) ?? SIZES[0];
    const box = this.canvas.parentElement?.getBoundingClientRect();
    const maxW = Math.min(560, box ? box.width - 24 : 560);
    const scale = Math.min(maxW / size.w, 560 / size.h, 1);
    this.canvas.width = size.w;
    this.canvas.height = size.h;
    this.canvas.style.width = `${Math.round(size.w * scale)}px`;
    this.canvas.style.height = `${Math.round(size.h * scale)}px`;
  }

  snapshot() {
    return JSON.stringify(this.art);
  }

  commit() {
    this.history.push(this.snapshot());
    if (this.history.length > 40) this.history.shift();
    this.future.length = 0;
    this.render();
  }

  undo() {
    if (!this.history.length) return;
    this.future.push(this.snapshot());
    this.art = JSON.parse(this.history.pop());
    this.fitCanvas();
    this.render();
    this.onChange();
  }

  redo() {
    if (!this.future.length) return;
    this.history.push(this.snapshot());
    this.art = JSON.parse(this.future.pop());
    this.fitCanvas();
    this.render();
    this.onChange();
  }

  async loadSamples() {
    const loaded = [];
    for (const s of SAMPLES) {
      try {
        const img = await loadImage(s.file);
        loaded.push({ id: s.id, name: s.name, img, zoom: 1, ox: 0, oy: 0 });
      } catch (err) {
        console.warn('sample failed', s.file, err);
      }
    }
    this.art.photos = loaded;
    this.render();
    this.onChange();
  }

  addPhoto(img, name) {
    this.commit();
    this.art.photos.push({ id: `up${Date.now()}`, name: name || 'Your photo', img, zoom: 1, ox: 0, oy: 0 });
    this.render();
    this.onChange();
  }

  selectPanel(i) {
    this.art.selected = i;
    this.render();
    this.onChange();
  }

  setPanelPhoto(photoIndex) {
    this.commit();
    this.art.panelPhoto[this.art.selected] = photoIndex;
    this.render();
    this.onChange();
  }

  setCrop(zoom, ox, oy) {
    const p = this.currentPhoto();
    if (!p) return;
    p.zoom = zoom;
    p.ox = ox;
    p.oy = oy;
    this.render();
  }

  commitCrop() {
    this.commit();
  }

  currentPhoto() {
    const idx = this.art.panelPhoto[this.art.selected] ?? 0;
    return this.art.photos[idx] ?? this.art.photos[0];
  }

  render() {
    if (!this.art.photos.length) {
      this.ctx.fillStyle = '#160a24';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      return;
    }
    drawCoverArt(this.ctx, this.art, this.canvas.width, this.canvas.height);
  }

  /** Render the cover at full export size and hand back a PNG blob. */
  async exportPng(sizeId) {
    const size = SIZES.find((s) => s.id === sizeId) ?? SIZES[0];
    const off = document.createElement('canvas');
    off.width = size.w;
    off.height = size.h;
    const ctx = off.getContext('2d');
    drawCoverArt(ctx, this.art, size.w, size.h);
    return new Promise((resolve) => off.toBlob(resolve, 'image/png'));
  }

  async download(sizeId) {
    const blob = await this.exportPng(sizeId);
    if (!blob) return null;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-lights-${sizeId}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    return blob;
  }
}

/** Build the control panel: layout, grade, title, text, crop, size, export. */
export function buildControls(root, editor) {
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };
  const section = (title) => {
    const s = el('section', 'ctl');
    s.appendChild(el('h2', '', title));
    root.appendChild(s);
    return s;
  };
  const refresh = () => {
    root.querySelectorAll('[data-active]').forEach((b) => {
      const kind = b.dataset.kind;
      const val = b.dataset.value;
      b.dataset.active = String(editor.art[kind] === val);
    });
    const cap = root.querySelector('#cap');
    if (cap && document.activeElement !== cap) cap.value = editor.art.caption;
    const sub = root.querySelector('#sub');
    if (sub && document.activeElement !== sub) sub.value = editor.art.subtitle;
    const badge = root.querySelector('#badge');
    if (badge && document.activeElement !== badge) badge.value = editor.art.badge;
  };

  const lay = section('Layout');
  LAYOUTS.forEach((l) => {
    const b = el('button', 'chip', l.name);
    b.dataset.kind = 'layout'; b.dataset.value = l.id;
    b.onclick = () => { editor.commit(); editor.art.layout = l.id; editor.render(); refresh(); };
    lay.appendChild(b);
  });

  const gr = section('Grade');
  GRADES.forEach((g) => {
    const b = el('button', 'chip', g.name);
    b.dataset.kind = 'grade'; b.dataset.value = g.id;
    b.style.setProperty('--sw', `linear-gradient(135deg, ${g.sky[0]}, ${g.sky[1]})`);
    b.onclick = () => { editor.commit(); editor.art.grade = g.id; editor.render(); refresh(); };
    gr.appendChild(b);
  });

  const ti = section('Title style');
  TITLE_STYLES.forEach((t) => {
    const b = el('button', 'chip', t.name);
    b.dataset.kind = 'titleStyle'; b.dataset.value = t.id;
    b.onclick = () => { editor.commit(); editor.art.titleStyle = t.id; editor.render(); refresh(); };
    ti.appendChild(b);
  });

  const tx = section('Words');
  const cap = el('input'); cap.id = 'cap'; cap.value = editor.art.caption; cap.maxLength = 28;
  cap.placeholder = 'Caption: VICE LIGHTS';
  cap.oninput = () => { editor.art.caption = cap.value; editor.render(); };
  cap.onchange = () => editor.commit();
  const sub = el('input'); sub.id = 'sub'; sub.value = editor.art.subtitle; sub.maxLength = 40;
  sub.placeholder = 'Subtitle: Leonida after dark';
  sub.oninput = () => { editor.art.subtitle = sub.value; editor.render(); };
  sub.onchange = () => editor.commit();
  const badge = el('input'); badge.id = 'badge'; badge.value = editor.art.badge; badge.maxLength = 14;
  badge.placeholder = 'Badge: LEONIDA';
  badge.oninput = () => { editor.art.badge = badge.value; editor.render(); };
  badge.onchange = () => editor.commit();
  tx.append(cap, sub, badge);
  const heat = el('div', 'heatrow');
  heat.appendChild(el('span', '', 'Heat'));
  for (let i = 1; i <= 5; i++) {
    const s = el('button', 'star', '★');
    s.onclick = () => { editor.commit(); editor.art.heat = i; editor.render(); refreshHeat(); };
    heat.appendChild(s);
  }
  const refreshHeat = () => {
    heat.querySelectorAll('.star').forEach((s, i) => { s.dataset.on = String(i < editor.art.heat); });
  };
  refreshHeat();
  tx.appendChild(heat);

  const ph = section('Photos');
  const tray = el('div', 'tray');
  ph.appendChild(tray);
  const up = el('label', 'upload', '＋ Add your photos');
  const file = el('input');
  file.type = 'file'; file.accept = 'image/*'; file.multiple = true;
  file.onchange = async () => {
    for (const f of file.files) {
      const url = URL.createObjectURL(f);
      try { editor.addPhoto(await loadImage(url), f.name.replace(/\.[^.]+$/, '')); } catch (e) { console.warn(e); }
    }
    file.value = '';
    drawTray();
  };
  up.appendChild(file);
  ph.appendChild(up);
  const drawTray = () => {
    tray.innerHTML = '';
    editor.art.photos.forEach((p, i) => {
      const t = el('button', 'thumb', p.name);
      t.style.backgroundImage = `url(${p.img.src})`;
      t.onclick = () => { editor.setPanelPhoto(i); drawTray(); };
      tray.appendChild(t);
    });
  };
  editor.onChange = () => { drawTray(); refresh(); };
  drawTray();

  const cr = section('Crop the selected panel');
  const mkSlider = (label, min, max, step, get, set) => {
    const row = el('div', 'slider');
    row.appendChild(el('span', '', label));
    const inp = el('input');
    inp.type = 'range'; inp.min = min; inp.max = max; inp.step = step; inp.value = get();
    inp.oninput = () => { set(parseFloat(inp.value)); editor.setCrop(editor.currentPhoto()?.zoom ?? 1, editor.currentPhoto()?.ox ?? 0, editor.currentPhoto()?.oy ?? 0); };
    inp.onchange = () => editor.commitCrop();
    row.appendChild(inp);
    return row;
  };
  cr.append(
    mkSlider('Zoom', 1, 2.2, 0.05, () => editor.currentPhoto()?.zoom ?? 1, (v) => { const p = editor.currentPhoto(); if (p) p.zoom = v; }),
    mkSlider('Pan ↔', -0.6, 0.6, 0.05, () => editor.currentPhoto()?.ox ?? 0, (v) => { const p = editor.currentPhoto(); if (p) p.ox = v; }),
    mkSlider('Pan ↕', -0.6, 0.6, 0.05, () => editor.currentPhoto()?.oy ?? 0, (v) => { const p = editor.currentPhoto(); if (p) p.oy = v; }),
  );
  const panels = el('div', 'panels');
  panels.appendChild(el('span', '', 'Panel'));
  for (let i = 0; i < 9; i++) {
    const b = el('button', 'pbtn', String(i + 1));
    b.onclick = () => editor.selectPanel(i);
    panels.appendChild(b);
  }
  cr.appendChild(panels);

  const ex = section('Export');
  const sizeSel = el('select');
  SIZES.forEach((s) => {
    const o = el('option', '', `${s.name} (${s.w}x${s.h})`);
    o.value = s.id;
    sizeSel.appendChild(o);
  });
  sizeSel.value = editor.art.size;
  sizeSel.onchange = () => { editor.commit(); editor.art.size = sizeSel.value; editor.fitCanvas(); editor.render(); };
  const go = el('button', 'export', 'Export PNG');
  go.onclick = async () => {
    go.disabled = true;
    go.textContent = 'Rendering…';
    await editor.download(sizeSel.value);
    go.disabled = false;
    go.textContent = 'Export PNG';
  };
  const undo = el('button', 'mini', 'Undo');
  undo.onclick = () => editor.undo();
  const redo = el('button', 'mini', 'Redo');
  redo.onclick = () => editor.redo();
  ex.append(sizeSel, go, undo, redo);
  refresh();
  return refresh;
}
