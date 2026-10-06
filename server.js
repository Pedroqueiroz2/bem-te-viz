import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadCatalog } from "./src/catalog-loader.js";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const processedDirectory = process.env.BIRD_CATALOG_DIR
  ? path.resolve(process.env.BIRD_CATALOG_DIR)
  : path.join(ROOT, "data", "processed", "bem-te-viz-package");
// Muda a cada início do servidor: o navegador usa para zerar contador, ranking e histórico.
const SESSION_ID = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const loaded = loadCatalog({ processedDirectory, demoDirectory: path.join(ROOT, "data", "demo") });
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
  ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".wav": "audio/wav",
  ".m4a": "audio/mp4", ".flac": "audio/flac", ".ico": "image/x-icon",
};

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream", "X-Content-Type-Options": "nosniff" });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname); }
  catch { res.writeHead(400).end("URL inválida"); return; }

  if (req.method !== "GET" && req.method !== "HEAD") { res.writeHead(405).end("Método não permitido"); return; }
  if (pathname === "/api/catalog") {
    const payload = {
      schemaVersion: loaded.catalog.schemaVersion,
      birds: loaded.catalog.birds,
      session: SESSION_ID,
      source: loaded.source,
      stats: loaded.stats,
      fallbackReason: loaded.fallbackReason ?? null,
    };
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    res.end(JSON.stringify(payload));
    return;
  }

  if (pathname.startsWith("/media/")) {
    const relativePath = pathname.slice("/media/".length);
    if (!relativePath || relativePath.split("/").includes("..")) { res.writeHead(400).end("Caminho inválido"); return; }
    const filePath = path.resolve(loaded.directory, "media", relativePath);
    const mediaRoot = path.resolve(loaded.directory, "media") + path.sep;
    if (!filePath.startsWith(mediaRoot)) { res.writeHead(403).end("Acesso negado"); return; }
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) { res.writeHead(404).end("Mídia não encontrada"); return; }
    sendFile(res, filePath);
    return;
  }

  const sourceRequest = pathname.startsWith("/src/");
  const requested = sourceRequest
    ? pathname.slice("/src/".length)
    : pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const staticRoot = path.resolve(ROOT, sourceRequest ? "src" : "public");
  const filePath = path.resolve(staticRoot, requested);

  if (!filePath.startsWith(staticRoot + path.sep) ||
      !fs.existsSync(filePath) ||
      !fs.statSync(filePath).isFile()) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" })
      .end("404 - Arquivo não encontrado");
    return;
  }
  sendFile(res, filePath);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Bem-te-viz em http://localhost:${PORT} | catálogo: ${loaded.source} (${loaded.stats.species} espécies, ${loaded.stats.images} imagens, ${loaded.stats.audios} áudios)`);
  if (loaded.fallbackReason) console.log(`Pacote processado indisponível; usando demonstração local. Motivo: ${loaded.fallbackReason}`);
});
