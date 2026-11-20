// Fixed scenes for screenshots and self-tests.
// ?shot=cover shows one exported cover alone, drawn by the app's own cover
// engine at the window's size. ?shot=editor shows the editor with a sample
// photo loaded. ?shot=export renders a PNG through the export path and
// reports its bytes into the page so a headless run can verify it.
// window.__shotReady is set once the scene has painted.

import { drawCoverArt } from './cover.js';

function readState(query, editor) {
  const art = editor.art;
  if (query.get('layout')) art.layout = query.get('layout');
  if (query.get('grade')) art.grade = query.get('grade');
  if (query.get('title')) art.titleStyle = query.get('title');
  if (query.get('caption')) art.caption = query.get('caption');
  if (query.get('subtitle')) art.subtitle = query.get('subtitle');
  if (query.get('badge')) art.badge = query.get('badge');
  if (query.get('heat')) art.heat = parseInt(query.get('heat'), 10) || 0;
  const photo = query.get('photo');
  if (photo) {
    const idx = editor.art.photos.findIndex((p) => p.id === photo);
    if (idx >= 0) art.panelPhoto = art.panelPhoto.map(() => idx);
  }
  const photos = query.get('photos');
  if (photos) {
    const ids = photos.split(',').map((s) => s.trim()).filter(Boolean);
    art.panelPhoto = ids.map((id) => {
      const idx = editor.art.photos.findIndex((p) => p.id === id);
      return idx >= 0 ? idx : 0;
    });
  }
  return art;
}

export async function runShot(shot, query, editor) {
  await document.fonts.ready;
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const art = readState(query, editor);
    const canvas = document.getElementById('cover');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    const ctx = canvas.getContext('2d');
    drawCoverArt(ctx, art, canvas.width, canvas.height);
  } else if (shot === 'editor') {
    readState(query, editor);
    editor.render();
  } else if (shot === 'export') {
    readState(query, editor);
    const size = query.get('size') || '1080x1350';
    const blob = await editor.exportPng(size);
    const box = document.getElementById('shot-result');
    if (box) {
      box.textContent = blob
        ? `export ${size} ${blob.size} bytes type ${blob.type}`
        : 'export failed: no blob';
    }
  }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
