// Neon Boulevard Press: the check driver.
//
// Boots the dev server, drives headless Chromium over CDP with the
// WebSocket client Node ships, and checks three things:
//   1. the four screenshots in shots.json come out under the cap,
//   2. no console error shows up on any of those pages,
//   3. Export in the app downloads a real PNG at 1080 by 1350.
//
// Run from the repo root: node tools/check.mjs
// It leaves screenshots/*.jpg and tools/downloads/neon-boulevard-*.png.

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const shots = JSON.parse(readFileSync(join(root, "shots.json"), "utf8")).shots;
const shotsDir = join(root, "screenshots");
const dlDir = join(root, "tools", "downloads");
const profileDir = join(root, "tools", ".chrome-profile");
mkdirSync(shotsDir, { recursive: true });
mkdirSync(dlDir, { recursive: true });

const CHROME = [
  process.env.CHROME,
  "/opt/meta-chromium/chrome",
  `${process.env.HOME}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`,
  `${process.env.HOME}/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell`,
].filter(Boolean);

const DEBUG_PORT = 9223;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const errors = [];

async function waitFor(url, tries = 60) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch { /* not up yet */ }
    await sleep(250);
  }
  return false;
}

function startServer() {
  const proc = spawn(process.execPath, ["serve.ts", "--port", "8080"], {
    cwd: root, stdio: "ignore",
  });
  return proc;
}

async function startChrome() {
  for (const bin of CHROME) {
    if (!existsSync(bin)) continue;
    const proc = spawn(bin, [
      "--headless=new",
      `--remote-debugging-port=${DEBUG_PORT}`,
      `--user-data-dir=${profileDir}`,
      "--no-sandbox",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      "about:blank",
    ], { stdio: "ignore" });
    if (await waitFor(`http://127.0.0.1:${DEBUG_PORT}/json/version`)) return proc;
    proc.kill();
  }
  throw new Error("check: no Chrome binary answered on the debug port");
}

// A minimal CDP client over one WebSocket.
class Session {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 1;
    this.pending = new Map();
    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result || {});
      } else if (msg.method === "Runtime.exceptionThrown") {
        const d = msg.params.exceptionDetails;
        errors.push(`exception: ${d.text} ${d.exception?.description || ""}`.trim());
      } else if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
        errors.push(`console.error: ${msg.params.args.map((a) => a.value ?? a.description ?? "").join(" ")}`);
      } else if (msg.method === "Network.loadingFailed") {
        errors.push(`network failed: ${msg.params.errorText}`);
      }
    });
  }
  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async eval(expression) {
    const r = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
    return r.result?.value;
  }
}

function pngSize(buf) {
  if (buf.length < 33 || buf.readUInt32BE(12) !== 0x49484452) return null;
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

async function main() {
  const server = startServer();
  if (!(await waitFor("http://127.0.0.1:8080/"))) {
    server.kill();
    throw new Error("check: the dev server never came up");
  }
  const chrome = await startChrome();
  const report = { shots: [], consoleErrors: [], export: null };
  try {
    const targets = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json();
    const page = targets.find((t) => t.type === "page");
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((res, rej) => {
      ws.addEventListener("open", res);
      ws.addEventListener("error", rej);
    });
    const cdp = new Session(ws);
    await cdp.send("Runtime.enable");
    await cdp.send("Page.enable");
    await cdp.send("Network.enable");
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });

    for (const shot of shots) {
      await cdp.send("Page.navigate", { url: shot.url });
      let ready = false;
      for (let i = 0; i < 40; i++) {
        await sleep(250);
        try { ready = await cdp.eval("window.__ready"); } catch { ready = false; }
        if (ready) break;
      }
      if (!ready) throw new Error(`check: ${shot.url} never signalled ready`);
      await sleep(400);
      let quality = 82;
      let bytes = 0;
      for (;;) {
        const shot1 = await cdp.send("Page.captureScreenshot", { format: "jpeg", quality });
        bytes = Buffer.from(shot1.data, "base64");
        if (bytes.length <= 262144 || quality <= 55) break;
        quality -= 12;
      }
      writeFileSync(join(shotsDir, shot.file), bytes);
      report.shots.push({ file: shot.file, bytes: bytes.length, quality });
      console.log(`shot ${shot.file}: ${bytes.length} bytes (quality ${quality})`);
    }

    // Export check: ask the app for a portrait PNG and look for it.
    // Clear older downloads first, the file name stays the same.
    for (const f of readdirSync(dlDir)) {
      if (f.endsWith(".png")) rmSync(join(dlDir, f));
    }
    await cdp.send("Page.setDownloadBehavior", { behavior: "allow", downloadPath: dlDir });
    await cdp.send("Page.navigate", { url: "http://localhost:8080/?shot=editor&size=1080x1350" });
    for (let i = 0; i < 40; i++) {
      await sleep(250);
      try { if (await cdp.eval("window.__ready")) break; } catch { /* retry */ }
    }
    await sleep(400);
    const before = new Set(readdirSync(dlDir));
    await cdp.eval(`window.NBP.exportPNG("1080x1350")`);
    let png = null;
    for (let i = 0; i < 40; i++) {
      await sleep(250);
      const fresh = readdirSync(dlDir).filter((f) => f.endsWith(".png") && !before.has(f));
      if (fresh.length) { png = fresh[0]; break; }
    }
    if (!png) throw new Error("check: no PNG landed in tools/downloads");
    const buf = readFileSync(join(dlDir, png));
    const dims = pngSize(buf);
    report.export = { file: png, bytes: buf.length, ...dims };
    console.log(`export ${png}: ${buf.length} bytes, ${dims?.w}x${dims?.h}`);
    ws.close();
  } finally {
    chrome.kill();
    server.kill();
  }
  report.consoleErrors = errors;
  console.log(`console errors: ${errors.length}`);
  for (const e of errors) console.log(`  ${e}`);
  if (errors.length) throw new Error(`check: ${errors.length} console error(s)`);
  if (!report.export || report.export.w !== 1080 || report.export.h !== 1350) {
    throw new Error(`check: export PNG is not 1080x1350: ${JSON.stringify(report.export)}`);
  }
  console.log("check: all green");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
