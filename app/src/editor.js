// Editor state for Vice Lights Press: photos, panel assignment, undo/redo
// and the live preview canvas with drag-to-pan and wheel-to-zoom per panel.

import { defaultState, layoutDef, panelRects, renderCover } from './cover.js';
import { SCENE_NAMES, sceneCanvas } from './scenes.js';

export const SAMPLE_IDS = SCENE_NAMES;

function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

/** Make sure the state's panel list matches its layout's panel count. */
export function fitPanels(state) {
  const n = layoutDef(state.layout).panels;
  const fresh = [];
  for (let i = 0; i < n; i++) {
    const old = state.panels[i];
    fresh.push(
      old || {
        photo: SCENE_NAMES[i % SCENE_NAMES.length],
        zoom: 1,
        ox: 0,
        oy: 0,
      },
    );
  }
  state.panels = fresh;
  return state;
}

export function createEditor(previewCanvas) {
  const state = fitPanels(defaultState());
  const photos = {};
  for (const name of SCENE_NAMES) photos[name] = sceneCanvas(name, 1200, 900);

  let history = [cloneState(state)];
  let index = 0;
  let selected = 0;
  let uploadCount = 0;
  const listeners = new Set();

  function emit() {
    for (const fn of listeners) fn(state);
  }

  function commit() {
    history = history.slice(0, index + 1);
    history.push(cloneState(state));
    if (history.length > 60) history.shift();
    index = history.length - 1;
    emit();
  }

  function undo() {
    if (index <= 0) return false;
    index--;
    const next = cloneState(history[index]);
    state.layout = next.layout;
    state.grade = next.grade;
    state.titleStyle = next.titleStyle;
    state.title = next.title;
    state.subtitle = next.subtitle;
    state.size = next.size;
    state.heat = next.heat;
    state.badge = next.badge;
    state.panels = next.panels;
    emit();
    return true;
  }

  function redo() {
    if (index >= history.length - 1) return false;
    index++;
    const next = cloneState(history[index]);
    state.layout = next.layout;
    state.grade = next.grade;
    state.titleStyle = next.titleStyle;
    state.title = next.title;
    state.subtitle = next.subtitle;
    state.size = next.size;
    state.heat = next.heat;
    state.badge = next.badge;
    state.panels = next.panels;
    emit();
    return true;
  }

  function set(patch, record = true) {
    Object.assign(state, patch);
    if (patch.layout) fitPanels(state);
    if (record) commit();
    else emit();
  }

  function setPanel(i, patch, record = true) {
    if (!state.panels[i]) return;
    Object.assign(state.panels[i], patch);
    if (record) commit();
    else emit();
  }

  function selectPanel(i) {
    if (i >= 0 && i < state.panels.length) {
      selected = i;
      emit();
    }
  }

  function addUpload(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        uploadCount++;
        const id = `upload-${uploadCount}`;
        photos[id] = img;
        resolve(id);
      };
      img.onerror = () => reject(new Error('could not read that image'));
      img.src = url;
    });
  }

  function drawPreview() {
    const ctx = previewCanvas.getContext('2d');
    const w = previewCanvas.width;
    const h = previewCanvas.height;
    renderCover(ctx, state, photos, w, h);
    // Outline the selected panel.
    const rects = panelRects(state.layout, w, h);
    const rect = rects[selected];
    if (rect) {
      ctx.save();
      ctx.strokeStyle = '#ffd319';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 6]);
      ctx.strokeRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
      ctx.restore();
    }
  }

  function pickPanelAt(px, py) {
    const w = previewCanvas.width;
    const h = previewCanvas.height;
    const rect = previewCanvas.getBoundingClientRect();
    const x = (px - rect.left) * (w / rect.width);
    const y = (py - rect.top) * (h / rect.height);
    const rects = panelRects(state.layout, w, h);
    for (let i = rects.length - 1; i >= 0; i--) {
      const r = rects[i];
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
    }
    return -1;
  }

  function attachPointer() {
    let drag = null;
    previewCanvas.addEventListener('pointerdown', (ev) => {
      const i = pickPanelAt(ev.clientX, ev.clientY);
      if (i < 0) return;
      selectPanel(i);
      drag = { x: ev.clientX, y: ev.clientY, ox: state.panels[i].ox, oy: state.panels[i].oy, moved: false };
      previewCanvas.setPointerCapture(ev.pointerId);
    });
    previewCanvas.addEventListener('pointermove', (ev) => {
      if (!drag) return;
      const dx = (ev.clientX - drag.x) / previewCanvas.getBoundingClientRect().width;
      const dy = (ev.clientY - drag.y) / previewCanvas.getBoundingClientRect().height;
      if (Math.abs(dx) + Math.abs(dy) > 0.004) drag.moved = true;
      const panel = state.panels[selected];
      panel.ox = Math.max(-1, Math.min(1, drag.ox + dx * 6));
      panel.oy = Math.max(-1, Math.min(1, drag.oy + dy * 6));
      drawPreview();
    });
    previewCanvas.addEventListener('pointerup', () => {
      if (drag && drag.moved) commit();
      drag = null;
    });
    previewCanvas.addEventListener('wheel', (ev) => {
      ev.preventDefault();
      const panel = state.panels[selected];
      if (!panel) return;
      const next = Math.max(1, Math.min(3, panel.zoom * (ev.deltaY < 0 ? 1.08 : 0.93)));
      panel.zoom = Math.round(next * 100) / 100;
      drawPreview();
      commit();
    }, { passive: false });
  }

  return {
    state,
    photos,
    get selected() {
      return selected;
    },
    onChange(fn) {
      listeners.add(fn);
    },
    set,
    setPanel,
    selectPanel,
    addUpload,
    undo,
    redo,
    drawPreview,
    attachPointer,
    canUndo() {
      return index > 0;
    },
    canRedo() {
      return index < history.length - 1;
    },
  };
}
