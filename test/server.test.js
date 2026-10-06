import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { makeFixture, startServer } from "./e2e/helpers.js";

let fixture;
let server;

before(async () => {
  fixture = makeFixture();
  server = await startServer({ catalogDir: fixture });
});

after(async () => {
  await server.stop();
  fs.rmSync(fixture, { recursive: true, force: true });
});

/** Requisição com o caminho exatamente como escrito (fetch normalizaria os "..") */
function raw(port, requestPath, method = "GET") {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: "127.0.0.1", port, path: requestPath, method }, (res) => {
      let body = "";
      res.on("data", (d) => (body += d));
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on("error", reject);
    req.end();
  });
}

test("/api/catalog devolve as aves, a origem e o identificador da sessão", async () => {
  const data = await (await fetch(`${server.base}/api/catalog`)).json();
  assert.equal(data.birds.length, 7);
  assert.equal(data.source, "processed");
  assert.equal(typeof data.session, "string");
  assert.ok(data.session.length > 4);
  assert.deepEqual(data.stats, { species: 7, images: 7, audios: 4 });
});

test("cada início do servidor gera uma sessão nova", async () => {
  const other = await startServer({ catalogDir: fixture });
  try {
    const a = (await (await fetch(`${server.base}/api/catalog`)).json()).session;
    const b = (await (await fetch(`${other.base}/api/catalog`)).json()).session;
    assert.notEqual(a, b);
  } finally {
    await other.stop();
  }
});

test("mídia é entregue com o tipo correto", async () => {
  const data = await (await fetch(`${server.base}/api/catalog`)).json();
  const withMedia = data.birds.find((b) => b.images.length && b.audios.length);
  const img = await fetch(`${server.base}/${withMedia.images[0]}`);
  assert.equal(img.status, 200);
  assert.equal(img.headers.get("content-type"), "image/jpeg");
  const audio = await fetch(`${server.base}/${withMedia.audios[0]}`);
  assert.equal(audio.status, 200);
  assert.equal(audio.headers.get("content-type"), "audio/mpeg");
});

test("arquivo inexistente devolve 404", async () => {
  assert.equal((await raw(server.port, "/nao-existe.html")).status, 404);
  assert.equal((await raw(server.port, "/media/images/nao-existe.jpg")).status, 404);
});

test("só aceita GET e HEAD", async () => {
  assert.equal((await raw(server.port, "/api/catalog", "POST")).status, 405);
  assert.equal((await raw(server.port, "/", "DELETE")).status, 405);
  assert.equal((await raw(server.port, "/", "HEAD")).status, 200);
});

test("não deixa sair das pastas permitidas (path traversal)", async () => {
  const attempts = [
    "/media/../catalog.json",
    "/media/%2e%2e/catalog.json",
    "/media/images/../../manifest.json",
    "/src/../package.json",
    "/src/%2e%2e/package.json",
    "/../package.json",
    "/%2e%2e/%2e%2e/etc/hosts",
  ];
  for (const attempt of attempts) {
    const { status, body } = await raw(server.port, attempt);
    assert.ok([400, 403, 404].includes(status), `${attempt} devolveu ${status}`);
    assert.ok(!body.includes('"name": "bem-te-viz"') && !body.includes("schemaVersion"), `${attempt} vazou arquivo`);
  }
});

test("URL malformada devolve 400 sem derrubar o servidor", async () => {
  assert.equal((await raw(server.port, "/%E0%A4%A")).status, 400);
  assert.equal((await raw(server.port, "/api/catalog")).status, 200);
});

test("pacote ausente ou inválido cai para a amostra de demonstração", async () => {
  const empty = fs.mkdtempSync(path.join(os.tmpdir(), "bem-te-viz-empty-"));
  const other = await startServer({ catalogDir: empty });
  try {
    const data = await (await fetch(`${other.base}/api/catalog`)).json();
    assert.equal(data.source, "demo");
    assert.ok(data.fallbackReason);
    assert.equal(data.birds.length, 200);
  } finally {
    await other.stop();
    fs.rmSync(empty, { recursive: true, force: true });
  }
});

test("pacote com mídia faltando é recusado", async () => {
  const broken = makeFixture();
  fs.rmSync(path.join(broken, "media", "images", "f1.jpg"));
  const other = await startServer({ catalogDir: broken });
  try {
    const data = await (await fetch(`${other.base}/api/catalog`)).json();
    assert.equal(data.source, "demo");
    assert.match(data.fallbackReason, /mídia ausente|vazia/);
  } finally {
    await other.stop();
    fs.rmSync(broken, { recursive: true, force: true });
  }
});
