// Neon Boulevard Press: verification driver.
//
// Drives headless Chromium over CDP with Node's built-in WebSocket client.
// It takes the four screenshots from shots.json, records console errors,
// and checks a real PNG export by clicking the app's own Download button.
//
// Run from the repo root with the server up: node serve.ts
//   node tools/verify.mjs
//
// It writes screenshots/*.jpg and tools/downloads/neon-boulevard-*.png.

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const shots = JSON.parse(readFileSync(join(root, "shots.json"), "utf8")).shots;
const shotsDir = join(root, "screenshots");
const dlDir = join(root, "tools", "downloads");
const profileDir = join(root, "tools", ".chrome-profile");
mkdirSync(shotsDir, { recursive: true });
mkdirSync(dlDir, { recursive: true });

const CHROME_CANDIDATES = [
  process.env.CHROME,
  `${process.env.HOME}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`,
  `${process.env.HOME}/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell`,
  "/opt/meta-chromium/chrome",
].filter(Boolean);

const PORT = 9222;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForDebugPort(tries = 40) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (res.ok) return true;
    } catch {
      // not up yet
    }
    await sleep(250);
  }
  return false;
}

async function launchChrome() {
  for (const bin of CHROME_CANDIDATES) {
    if (!existsSync(bin)) continue;
    const proc = spawn(bin, [
      "--headless=new",
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${profileDir}`,
      "--no-sandbox",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      "about:blank",
    ], { stdio: "ignore" });
    if (await waitForDebugPort()) return proc;
    proc.kill();
  }
  throw new Error("verify: no Chrome binary answered on the debug port");
}

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 1;
    this.pending = new Map();
    this.events = [];
    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(`${msg.error.message}`));
        else resolve(msg.result || {});
      } else if (msg.method) {
        this.events.push(msg);
      }
    });
  }

  static async connect() {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    const page = list.find((t) => t.type === "page");
    if (!page) throw new Error("verify: no page target");
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener("open", resolve);
      ws.addEventListener("error", reject);
    });
    return new Cdp(ws);
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`verify: CDP timeout on ${method}`));
        }
      }, 30000);
    });
  }

  async eval(expr) {
    const r = await this.send("Runtime.evaluate", { expression: expr, returnByValue: true });
    if (r.exceptionDetails) throw new Error(`verify: eval failed: ${JSON.stringify(r.exceptionDetails)}`);
    return r.result ? r.result.value : undefined;
  }
}

function consoleErrors(cdp) {
  const bad = [];
  for (const ev of cdp.events) {
    if (ev.method === "Runtime.exceptionThrown") {
      bad.push(`exception: ${ev.params.exceptionDetails.text} ${ev.params.exceptionDetails.exception?.description || ""}`);
    } else if (ev.method === "Runtime.consoleAPICalled" && ev.params.type === "error") {
      bad.push(`console.error: ${ev.params.args.map((a) => a.value ?? a.description ?? "").join(" ")}`);
    } else if (ev.method === "Log.entryAdded" && ev.params.entry.level === "error") {
      bad.push(`log: ${ev.params.entry.text} ${ev.params.entry.url || ""}`);
    }
  }
  return bad;
}

async function shoot(cdp, shot) {
  const url = new URL(shot.url);
  const size = url.searchParams.get("size");
  let vw = 1440;
  let vh = 900;
  if (size) {
    const [w, h] = size.split("x").map(Number);
    vw = w;
    vh = h;
  } else if (url.searchParams.get("shot") === "cover") {
    vw = 1080;
    vh = 1350;
  }
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: vw, height: vh, deviceScaleFactor: 1, mobile: false });
  cdp.events.length = 0;
  await cdp.send("Page.navigate", { url: shot.url });
  const t0 = Date.now();
  let ready = false;
  while (Date.now() - t0 < 15000) {
    await sleep(400);
    try {
      ready = await cdp.eval(
        `!!window.__press && [...document.images].every(i => i.complete) && window.__press.photos.size === 3`
      );
    } catch {
      ready = false;
    }
    if (ready) break;
  }
  if (!ready) throw new Error(`verify: ${shot.file} never became ready (${shot.url})`);
  await sleep(600);
  const errors = consoleErrors(cdp);
  let quality = 80;
  let buf = null;
  let bytes = 0;
  for (const q of [80, 60, 40]) {
    quality = q;
    const r = await cdp.send("Page.captureScreenshot", { format: "jpeg", quality: q });
    buf = Buffer.from(r.data, "base64");
    bytes = buf.length;
    if (bytes <= 262144) break;
  }
  const out = join(shotsDir, shot.file);
  writeFileSync(out, buf);
  return { file: shot.file, url: shot.url, viewport: `${vw}x${vh}`, bytes, quality, consoleErrors: errors, ready };
}

function pngSize(path) {
  const b = readFileSync(path);
  if (b.length < 24 || b.toString("ascii", 1, 4) !== "PNG") throw new Error(`verify: ${path} is not a PNG`);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), bytes: b.length };
}

async function checkExport(cdp) {
  const url = "http://localhost:8080/?shot=cover&layout=cards&grade=gold&size=1080x1350";
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1080, height: 1350, deviceScaleFactor: 1, mobile: false });
  await cdp.send("Page.navigate", { url });
  const t0 = Date.now();
  let ready = false;
  while (Date.now() - t0 < 15000) {
    await sleep(400);
    try {
      ready = await cdp.eval(`!!window.__press && window.__press.photos.size === 3`);
    } catch {
      ready = false;
    }
    if (ready) break;
  }
  if (!ready) throw new Error("verify: export page never became ready");
  await cdp.eval(`document.getElementById("btn-save").click()`);
  const want = "neon-boulevard-1080x1350.png";
  for (let i = 0; i < 25; i++) {
    await sleep(400);
    const hit = readdirSync(dlDir).find((f) => f === want);
    if (hit) {
      await sleep(300);
      const info = pngSize(join(dlDir, hit));
      return { file: hit, ...info };
    }
  }
  throw new Error(`verify: no ${want} appeared in tools/downloads`);
}

async function main() {
  const chrome = await launchChrome();
  try {
    const cdp = await Cdp.connect();
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Log.enable");
    try {
      await cdp.send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: dlDir });
    } catch {
      await cdp.send("Page.setDownloadBehavior", { behavior: "allow", downloadPath: dlDir });
    }
    const results = [];
    for (const shot of shots) results.push(await shoot(cdp, shot));
    const exported = await checkExport(cdp);
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
    console.log("verify: all checks passed");
  } finally {
    chrome.kill();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
