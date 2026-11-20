// Vice Lights Press: bootstrap.
// Loads the vendored fonts, starts the editor with the built-in samples, and
// hands ?shot= scenes to shots.js. Any window error is recorded into the
// page so a headless run can see it.

import { Editor, buildControls } from './editor.js';
import { runShot } from './shots.js';

window.__errors = [];
window.addEventListener('error', (ev) => {
  window.__errors.push(String(ev.message || ev.error));
  const box = document.getElementById('err');
  if (box) box.textContent = window.__errors.join(' | ');
});

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
const canvas = document.getElementById('cover');
const editor = new Editor(canvas);

async function start() {
  try {
    await Promise.all([
      document.fonts.load('700 100px "Vice Sans"'),
      document.fonts.load('italic 700 40px "Vice Serif"'),
    ]);
  } catch (err) {
    console.warn('font load', err);
  }
  await editor.loadSamples();
  buildControls(document.getElementById('controls'), editor);
  if (shot) {
    await runShot(shot, query, editor);
  } else {
    editor.render();
  }
}

start();
