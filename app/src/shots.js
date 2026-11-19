// Fixed scenes for screenshots, driven by ?shot=.
// ?shot=cover renders the cover alone at export size.
// ?shot=editor shows the full editor with photos loaded.
// ?shot=cover-square renders the square cover alone.
// Each scene sets window.__shotReady once painted, so a screenshot
// script knows when the frame is done.
import { SIZES } from './cover.js';

export function runShot(shot, query, app) {
  const { state, redraw, syncControls, sizeCanvas } = app;
  const caption = query.get('caption');
  const layout = query.get('layout');
  const grade = query.get('grade');
  const size = query.get('size');
  if (caption) state.title = caption;
  if (layout) state.layout = layout;
  if (grade) state.grade = grade;
  if (size && SIZES[size]) state.size = size;
  if (query.get('subtitle')) state.subtitle = query.get('subtitle');

  syncControls();
  sizeCanvas();
  if (shot === 'cover' || shot === 'cover-square') {
    document.body.classList.add('shot-cover');
    const s = SIZES[state.size] || SIZES.wide;
    const canvas = document.getElementById('cover');
    canvas.width = s.w;
    canvas.height = s.h;
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
  }
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
