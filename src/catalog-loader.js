import fs from "node:fs";
import path from "node:path";

const MEDIA_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".mp3", ".ogg", ".wav", ".m4a", ".flac"]);

function validatePackage(directory) {
  const catalogPath = path.join(directory, "catalog.json");
  const manifestPath = path.join(directory, "manifest.json");
  if (!fs.existsSync(catalogPath) || !fs.existsSync(manifestPath)) throw new Error("catalog.json ou manifest.json ausente");
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (!Array.isArray(catalog.birds) || !catalog.birds.length) throw new Error("catálogo sem espécies");
  if (manifest.validation?.status !== "passed") throw new Error("manifesto não validado");

  const seenIds = new Set();
  const seenMedia = new Set();
  let images = 0;
  let audios = 0;
  for (const bird of catalog.birds) {
    if (!bird || typeof bird.id !== "string" || typeof bird.species !== "string" || !bird.species.trim()) throw new Error("registro de espécie inválido");
    if (seenIds.has(bird.id)) throw new Error(`ID duplicado: ${bird.id}`);
    seenIds.add(bird.id);
    for (const kind of ["images", "audios"]) {
      if (!Array.isArray(bird[kind])) throw new Error(`campo ${kind} inválido em ${bird.species}`);
      for (const relativePath of bird[kind]) {
        if (typeof relativePath !== "string" || path.isAbsolute(relativePath) || relativePath.split(/[\\/]/).includes("..")) throw new Error(`caminho inseguro em ${bird.species}`);
        const fullPath = path.resolve(directory, relativePath);
        if (!fullPath.startsWith(path.resolve(directory) + path.sep)) throw new Error(`caminho fora do pacote: ${relativePath}`);
        const extension = path.extname(fullPath).toLowerCase();
        if (!MEDIA_EXTENSIONS.has(extension)) throw new Error(`formato não suportado: ${relativePath}`);
        const stat = fs.statSync(fullPath, { throwIfNoEntry: false });
        if (!stat?.isFile() || stat.size === 0) throw new Error(`mídia ausente ou vazia: ${relativePath}`);
        if (seenMedia.has(relativePath)) throw new Error(`referência de mídia duplicada: ${relativePath}`);
        seenMedia.add(relativePath);
        if (kind === "images") images++; else audios++;
      }
    }
  }
  return { catalog, manifest, stats: { species: catalog.birds.length, images, audios } };
}

/** Tenta o pacote processado e usa a amostra incluída se ele estiver ausente ou inválido. */
export function loadCatalog({ processedDirectory, demoDirectory }) {
  try {
    return { ...validatePackage(processedDirectory), source: "processed", directory: processedDirectory };
  } catch (error) {
    const fallback = validatePackage(demoDirectory);
    return { ...fallback, source: "demo", directory: demoDirectory, fallbackReason: error.message };
  }
}

export { validatePackage };
