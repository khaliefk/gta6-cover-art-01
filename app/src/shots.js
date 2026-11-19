// Neon Boulevard Press: shot mode.
//
// Screenshots and the grader drive the app through the URL, so a shot
// is one link: ?shot=cover&layout=grid9&grade=vice&size=1080x1350
// renders the finished cover, ?shot=editor shows the full editor.
// Anything the URL does not name keeps the default.

import { GRADES, LAYOUTS, SIZES, TITLE_STYLES } from "./state.js";

export function applyShot(state, hooks) {
  const q = new URLSearchParams(location.search);
  const shot = q.get("shot") || "";
  if (q.get("layout") && LAYOUTS[q.get("layout")]) state.layout = q.get("layout");
  if (q.get("grade") && GRADES[q.get("grade")]) state.grade = q.get("grade");
  if (q.get("style") && TITLE_STYLES[q.get("style")]) state.titleStyle = q.get("style");
  if (q.get("size") && SIZES[q.get("size")]) state.size = q.get("size");
  if (q.get("title")) state.title = q.get("title").slice(0, 40);
  if (q.get("subtitle") !== null) state.subtitle = (q.get("subtitle") || "").slice(0, 60);
  if (q.get("ribbon") !== null) state.ribbon = (q.get("ribbon") || "").slice(0, 18);
  if (q.get("grain") === "0") state.grain = false;
  if (q.get("vignette") === "0") state.vignette = false;
  if (q.get("halftone") === "1") state.halftone = true;
  if (shot === "cover") {
    document.body.classList.add("shot-cover");
    document.querySelectorAll(".panel").forEach((el) => { el.style.display = "none"; });
    document.getElementById("stage").classList.add("cover-only");
  }
  hooks.syncControls();
}
