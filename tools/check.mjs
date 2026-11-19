// Neon Boulevard Press: the check driver.
//
// Starts the app server, drives headless Chromium over CDP with the
// WebSocket client Node ships, and does three things:
//   1. takes the four screenshots listed in shots.json,
//   2. records every console error along the way,
//   3. clicks Export in the app and checks the PNG that lands in
//      tools/downloads is really 1080 by 1350.
//
// Run from the repo root: node tools/check.mjs
// It leaves screenshots/*.jpg and tools/downloads/neon-boulevard-*.png.

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
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

const DEBUG_PORT = 9222;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function portUp() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
      if (res.ok) return true;
    } catch {
      // Chrome is still starting.
    }
    await sleep(250);
  }
  return false;
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
    if (await portUp()) return proc;
    proc.kill();
  }
  throw new Error("check: no Chrome binary answered on the debug port");
}

class Page {
  constructor(ws) {
    this.ws = ws;
    this.id = 1;
    this.waiting = new Map();
    this.events = [];
    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data);
      const slot = msg.id && this.waiting.get(msg.id);
      if (slot) {
        this.waiting.delete(msg.id);
        if (msg.error) slot.reject(new Error(msg.error.message));
        else slot.resolve(msg.result || {});
      } else if (msg.method) {
        this.events.push(msg);
      }
    });
  }

  static async open() {
    const targets = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json();
    const page = targets.find((t) => t.type === "page");
    if (!page) throw new Error("check: no page target");
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener("open", resolve);
      ws.addEventListener("error", reject);
    });
    return new Page(ws);
  }

  call(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.waiting.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (this.waiting.has(id)) {
          this.waiting.delete(id);
          reject(new Error(`check: CDP timed out on ${method}`));
        }
      }, 30000);
    });
  }

  async run(expr) {
    const r = await this.call("Runtime.evaluate", { expression: expr, returnByValue: true });
    if (r.exceptionDetails) throw new Error(`check: eval broke: ${JSON.stringify(r.exceptionDetails)}`);
    return r.result ? r.result.value : undefined;
  }

  errors() {
    const bad = [];
    for (const ev of this.events) {
      if (ev.method === "Runtime.exceptionThrown") {
        bad.push(`exception: ${ev.params.exceptionDetails.text}`);
      } else if (ev.method === "Runtime.consoleAPICalled" && ev.params.type === "error") {
        bad.push(`console.error: ${ev.params.args.map((a) => a.value ?? a.description ?? "").join(" ")}`);
      } else if (ev.method === "Log.entryAdded" && ev.params.entry.level === "error") {
        bad.push(`log: ${ev.params.entry.text}`);
      }
    }
    return bad;
  }
}

function viewportFor(shot) {
  const url = new URL(shot.url);
  const size = url.searchParams.get("size");
  if (size) {
    const [w, h] = size.split("x").map(Number);
    return { width: w, height: h };
  }
  return url.searchParams.get("shot") === "cover"
    ? { width: 1080, height: 1350 }
    : { width: 1440, height: 900 };
}

async function waitReady(page, seconds = 15) {
  const end = Date.now() + seconds * 1000;
  while (Date.now() < end) {
    await sleep(400);
    try {
      if (await page.run(`!!window.__pressReady && window.__press && window.__press.photos.size === 3`)) return true;
    } catch {
      // Page is still loading.
    }
  }
  return false;
}

async function takeShot(page, shot) {
  const vp = viewportFor(shot);
  await page.call("Emulation.setDeviceMetricsOverride", { ...vp, deviceScaleFactor: 1, mobile: false });
  page.events.length = 0;
  await page.call("Page.navigate", { url: shot.url });
  if (!(await waitReady(page))) throw new Error(`check: ${shot.file} never got ready`);
  await sleep(600);
  const errors = page.errors();
  let buf = null;
  let bytes = 0;
  let quality = 80;
  for (const q of [80, 60, 40]) {
    quality = q;
    const r = await page.call("Page.captureScreenshot", { format: "jpeg", quality: q });
    buf = Buffer.from(r.data, "base64");
    bytes = buf.length;
    if (bytes <= 262144) break;
  }
  writeFileSync(join(shotsDir, shot.file), buf);
  return { file: shot.file, url: shot.url, viewport: `${vp.width}x${vp.height}`, bytes, quality, consoleErrors: errors };
}

function readPngSize(path) {
  const b = readFileSync(path);
  if (b.length < 24 || b.toString("ascii", 1, 4) !== "PNG") throw new Error(`check: ${path} is not a PNG`);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), bytes: b.length };
}

async function checkExport(page) {
  const url = "http://localhost:8080/?shot=cover&layout=postcards&grade=golden&size=1080x1350";
  await page.call("Emulation.setDeviceMetricsOverride", { width: 1080, height: 1350, deviceScaleFactor: 1, mobile: false });
  await page.call("Page.navigate", { url });
  if (!(await waitReady(page))) throw new Error("check: export page never got ready");
  await page.run(`document.getElementById("btn-export").click()`);
  const want = "neon-boulevard-1080x1350.png";
  for (let i = 0; i < 25; i++) {
    await sleep(400);
    if (readdirSync(dlDir).includes(want)) {
      await sleep(300);
      return { file: want, ...readPngSize(join(dlDir, want)) };
    }
  }
  throw new Error(`check: ${want} never landed in tools/downloads`);
}

async function main() {
  const chrome = await startChrome();
  try {
    const page = await Page.open();
    await page.call("Page.enable");
    await page.call("Runtime.enable");
    await page.call("Log.enable");
    try {
      await page.call("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: dlDir });
    } catch {
      await page.call("Page.setDownloadBehavior", { behavior: "allow", downloadPath: dlDir });
    }
    const results = [];
    for (const shot of shots) results.push(await takeShot(page, shot));
    const exported = await checkExport(page);
    console.log(JSON.stringify({ shots: results, export: exported }, null, 2));
    const allErrors = results.flatMap((r) => r.consoleErrors);
    if (allErrors.length) {
      console.log("CONSOLE ERRORS FOUND:");
      for (const e of allErrors) console.log(" -", e);
      process.exitCode = 2;
    }
    const over = results.filter((r) => r.bytes > 262144);
    if (over.length) {
      console.log("OVERSIZE SHOTS:", over.map((r) => r.file).join(", "));
      process.exitCode = 3;
    }
    if (exported.w !== 1080 || exported.h !== 1350) {
      console.log(`EXPORT SIZE WRONG: ${exported.w}x${exported.h}, want 1080x1350`);
      process.exitCode = 4;
    }
    console.log("check: all checks passed");
  } finally {
    chrome.kill();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
