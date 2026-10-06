import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
    srv.on("error", reject);
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Espera `fn` devolver algo verdadeiro (sondando), ou falha com a mensagem. */
export async function until(fn, message, timeout = 8000) {
  const start = Date.now();
  for (;;) {
    const value = await fn();
    if (value) return value;
    if (Date.now() - start > timeout) throw new Error(`Tempo esgotado: ${message}`);
    await sleep(60);
  }
}

/** Catálogo pequeno e determinístico, com os casos de borda, montado com mídias reais de data/demo. */
export function makeFixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bem-te-viz-fixture-"));
  fs.mkdirSync(path.join(dir, "media", "images"), { recursive: true });
  fs.mkdirSync(path.join(dir, "media", "audios"), { recursive: true });
  const demo = path.join(ROOT, "data", "demo", "media");
  const image = path.join(demo, "images", fs.readdirSync(path.join(demo, "images"))[0]);
  const audio = path.join(demo, "audios", fs.readdirSync(path.join(demo, "audios"))[0]);
  let n = 0;
  const media = (kind, count) =>
    Array.from({ length: count }, () => {
      const rel = `media/${kind}/f${++n}${kind === "images" ? ".jpg" : ".mp3"}`;
      fs.copyFileSync(kind === "images" ? image : audio, path.join(dir, rel));
      return rel;
    });
  const bird = (id, species, images, audios) => ({ id: String(id), species, originalLabel: `${id}.${species}`, images: media("images", images), audios: media("audios", audios) });
  const birds = [
    bird(1, "Alpha Bird", 3, 2),
    bird(2, "Alphabet Wren", 1, 1),
    bird(3, "Beta Bird", 1, 0),
    bird(4, "Delta <b>Bold</b> Bird", 1, 0),
    bird(5, "Épsilon Café", 0, 0),
    bird(6, "Gamma Bird", 0, 0),
    bird(7, "Zeta Bird", 1, 1),
  ];
  fs.writeFileSync(path.join(dir, "catalog.json"), JSON.stringify({ schemaVersion: 1, birds }));
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify({ validation: { status: "passed", errors: [] } }));
  return dir;
}

/** Sobe o servidor do projeto e espera ele ficar pronto. */
export async function startServer({ port, catalogDir } = {}) {
  port ??= await freePort();
  const env = { ...process.env, PORT: String(port) };
  if (catalogDir) env.BIRD_CATALOG_DIR = catalogDir;
  const child = spawn(process.execPath, ["server.js"], { cwd: ROOT, env, stdio: ["ignore", "pipe", "pipe"] });
  let log = "";
  child.stdout.on("data", (d) => (log += d));
  child.stderr.on("data", (d) => (log += d));
  await until(() => log.includes("Bem-te-viz em") || child.exitCode !== null, `servidor não iniciou:\n${log}`, 15000);
  if (child.exitCode !== null) throw new Error(`servidor encerrou:\n${log}`);
  return {
    port,
    base: `http://127.0.0.1:${port}`,
    get log() { return log; },
    stop: () => new Promise((resolve) => { if (child.exitCode !== null) return resolve(); child.once("exit", resolve); child.kill(); }),
  };
}

const CHROME_PATHS = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
].filter(Boolean);

export const findChrome = () => CHROME_PATHS.find((p) => fs.existsSync(p));

/** Abre um Chrome sem tela (janela de desktop, 1280x900) controlado pelo protocolo DevTools. */
export async function launchBrowser() {
  const chromePath = findChrome();
  if (!chromePath) return null;
  const port = await freePort();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "bem-te-viz-chrome-"));
  const proc = spawn(chromePath, [
    "--headless=new", "--disable-gpu", "--no-first-run", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    "--window-size=1280,900", "--autoplay-policy=no-user-gesture-required", "about:blank",
  ], { stdio: "ignore" });
  const targets = await until(async () => {
    try { return (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page"); } catch { return null; }
  }, "Chrome não abriu", 15000);

  const ws = new WebSocket(targets.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let id = 0;
  const pending = new Map();
  const errors = [];
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result); pending.delete(msg.id); }
    if (msg.method === "Runtime.exceptionThrown") errors.push(msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text);
  };
  const send = (method, params = {}) => new Promise((resolve) => { const i = ++id; pending.set(i, resolve); ws.send(JSON.stringify({ id: i, method, params })); });
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });

  const page = {
    errors,
    async ev(expr) {
      const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) throw new Error(`erro na página: ${r.exceptionDetails.exception?.description || r.exceptionDetails.text}`);
      return r.result?.value;
    },
    /** Abre a URL e espera a página estar pronta. */
    async go(url) {
      await send("Page.navigate", { url });
      await until(() => page.ev("document.readyState === 'complete'").catch(() => false), `carregar ${url}`);
      await sleep(250);
    },
    async reload() {
      await send("Page.reload");
      await until(() => page.ev("document.readyState === 'complete'").catch(() => false), "recarregar");
      await sleep(250);
    },
    /** Muda só o hash (a página escuta `hashchange`). */
    async hash(h) {
      await page.ev(`location.hash = ${JSON.stringify(h)}`);
      await sleep(250);
    },
    until: (expr, message, timeout) => until(() => page.ev(expr).catch(() => false), message ?? expr, timeout),
    async type(selector, value) {
      await page.ev(`(() => { const i = document.querySelector(${JSON.stringify(selector)}); i.value = ${JSON.stringify(value)}; i.dispatchEvent(new Event('input', { bubbles: true })); })()`);
      await sleep(200);
    },
    addScriptOnNewDocument: (source) => send("Page.addScriptToEvaluateOnNewDocument", { source }),
    async close() {
      ws.close();
      proc.kill();
      await new Promise((r) => setTimeout(r, 200));
      fs.rmSync(profile, { recursive: true, force: true });
    },
  };
  return page;
}
