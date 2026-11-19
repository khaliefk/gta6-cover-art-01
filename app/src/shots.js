// Neon Boulevard Press: fixed scenes for screenshots.
//
// ?shot=cover shows the cover alone at the size the query asks for.
// ?shot=editor shows the full page with the tray and the controls.
// Both set window.__pressReady once the samples are loaded and the
// first paint is done, so a driver knows when to take the picture.

import { findSize } from "./data.js";

function readParams() {
  const q = new URLSearchParams(location.search);
  return {
    shot: q.get("shot") || "",
    layout: q.get("layout"),
    grade: q.get("grade"),
    size: q.get("size"),
    photo: q.get("photo"),
    caption: q.get("caption"),
  };
}

export async function runShot(press) {
  const p = readParams();
  if (p.layout) press.setLayout(p.layout);
  if (p.grade) press.setGrade(p.grade);
  if (p.caption) press.setTitle(p.caption);
  if (p.size) press.setSize(p.size);
  if (p.photo) press.fillAll(p.photo);
  await press.ready();
  const size = findSize(p.size || press.state.size);
  if (p.shot === "cover") {
    document.body.classList.add("shot-cover");
    press.canvas.width = size.w;
    press.canvas.height = size.h;
    press.paint();
  }
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      window.__pressReady = true;
    }),
  );
}
