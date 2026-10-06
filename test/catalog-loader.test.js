import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadCatalog, validatePackage } from "../src/catalog-loader.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const demoDirectory = path.join(projectRoot, "data", "demo");

test("valida pacote local de demonstração e mantém espécies sem áudio", () => {
  const loaded = validatePackage(demoDirectory);
  assert.equal(loaded.catalog.birds.length, 200);
  assert.equal(loaded.stats.images, 12);
  assert.equal(loaded.stats.audios, 8);
  assert.ok(loaded.catalog.birds.some((bird) => bird.images.length && bird.audios.length === 0));
});

test("usa o pacote processado quando está presente e válido", () => {
  const loaded = loadCatalog({ processedDirectory: demoDirectory, demoDirectory });
  assert.equal(loaded.source, "processed");
});

test("usa a amostra local quando o pacote processado está ausente ou inválido", () => {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "bem-te-viz-invalid-"));
  try {
    fs.writeFileSync(path.join(temporaryDirectory, "catalog.json"), "{}");
    const loaded = loadCatalog({ processedDirectory: temporaryDirectory, demoDirectory });
    assert.equal(loaded.source, "demo");
    assert.match(loaded.fallbackReason, /manifest.json/);
    assert.equal(loaded.stats.species, 200);
  } finally {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});

test("rejeita referências a mídias inexistentes", () => {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "bem-te-viz-missing-"));
  try {
    fs.writeFileSync(path.join(temporaryDirectory, "manifest.json"), JSON.stringify({ validation: { status: "passed" } }));
    fs.writeFileSync(path.join(temporaryDirectory, "catalog.json"), JSON.stringify({ birds: [{ id: "1", species: "Teste", images: ["media/images/missing.jpg"], audios: [] }] }));
    assert.throws(() => validatePackage(temporaryDirectory), /mídia ausente ou vazia/);
  } finally {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});
