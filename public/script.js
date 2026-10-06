import { SplayTree } from "../src/splay-tree.js";
import { birdKey } from "../src/bird.js";
import { stopAudioElements } from "../src/audio-playback.js";

const grid = document.querySelector("#grid-aves");
const input = document.querySelector("#input-busca");
const rootDisplay = document.querySelector("#tree-root-display");
const resultCount = document.querySelector("#result-count");
const sourceBadge = document.querySelector("#catalog-source");
const catalogPage = document.querySelector("#catalog-page");
const detailPage = document.querySelector("#detail-page");
const detailContent = document.querySelector("#detail-content");
const tree = new SplayTree();
let birds = [];

function mediaUrl(relativePath) {
  return "/media/" + relativePath.replace(/^media\//, "").split("/").map(encodeURIComponent).join("/");
}

function setTreeStatus(message = "") {
  const root = tree.rootSpecies || "vazia";
  rootDisplay.textContent = `Raiz atual: ${root} · ${tree.size} espécies${message ? ` · ${message}` : ""}`;
}

function createImage(path, species, className) {
  if (!path) {
    const placeholder = document.createElement("div");
    placeholder.className = `${className} image-placeholder`;
    placeholder.textContent = "Imagem não incluída na amostra";
    return placeholder;
  }
  const img = document.createElement("img");
  img.className = className;
  img.src = mediaUrl(path);
  img.alt = `Imagem de ${species}`;
  img.loading = "lazy";
  img.onerror = () => { img.replaceWith(createImage(null, species, className)); };
  return img;
}

function renderCards(items) {
  grid.replaceChildren();
  resultCount.textContent = `${items.length} ${items.length === 1 ? "espécie" : "espécies"}`;
  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "Nenhuma espécie encontrada para essa busca.";
    grid.append(empty);
    return;
  }
  for (const bird of items) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "bird-card";
    card.setAttribute("aria-label", `Abrir ${bird.species}`);
    card.append(createImage(bird.images[0], bird.species, "card-image"));
    const body = document.createElement("span");
    body.className = "card-body";
    const id = document.createElement("span");
    id.className = "card-id";
    id.textContent = `CUB · ${String(bird.id).padStart(3, "0")}`;
    const title = document.createElement("span");
    title.className = "card-title";
    title.textContent = bird.species;
    const meta = document.createElement("span");
    meta.className = "card-meta";
    meta.textContent = `${bird.images.length} ${bird.images.length === 1 ? "imagem" : "imagens"} · ${bird.audios.length} ${bird.audios.length === 1 ? "áudio" : "áudios"}`;
    body.append(id, title, meta);
    card.append(body);
    card.addEventListener("click", () => {
      const found = tree.search(bird.species) || bird;
      setTreeStatus(`acesso a ${found.species}; frequência ${tree.getAccessCount(found.species)}`);
      showDetails(found);
    });
    grid.append(card);
  }
}

function showDetails(bird) {
  stopAudioElements(detailContent);
  catalogPage.hidden = true;
  detailPage.hidden = false;
  detailContent.replaceChildren();
  const heading = document.createElement("div");
  heading.className = "detail-heading";
  const eyebrow = document.createElement("p");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = `Registro CUB · ${String(bird.id).padStart(3, "0")}`;
  const title = document.createElement("h1");
  title.textContent = bird.species;
  const label = document.createElement("p");
  label.className = "original-label";
  label.textContent = `Rótulo original: ${bird.originalLabel || bird.species}`;
  heading.append(eyebrow, title, label);

  const layout = document.createElement("div");
  layout.className = "detail-layout";
  const mediaColumn = document.createElement("section");
  mediaColumn.className = "detail-media";
  const mainImage = createImage(bird.images[0], bird.species, "detail-image");
  mediaColumn.append(mainImage);
  const gallery = document.createElement("div");
  gallery.className = "image-gallery";
  let shownImages = 0;
  const batchSize = 12;
  const loadMoreImages = () => {
    const end = Math.min(shownImages + batchSize, bird.images.length);
    for (const imagePath of bird.images.slice(shownImages, end)) {
      const thumbnail = document.createElement("button");
      thumbnail.type = "button";
      thumbnail.className = "gallery-thumbnail";
      thumbnail.setAttribute("aria-label", `Exibir outra imagem de ${bird.species}`);
      thumbnail.append(createImage(imagePath, bird.species, "thumbnail-image"));
      thumbnail.addEventListener("click", () => {
        if (mainImage instanceof HTMLImageElement) mainImage.src = mediaUrl(imagePath);
      });
      gallery.append(thumbnail);
    }
    shownImages = end;
    moreImages.hidden = shownImages >= bird.images.length;
  };
  const moreImages = document.createElement("button");
  moreImages.type = "button";
  moreImages.className = "load-more";
  moreImages.textContent = "Carregar mais imagens";
  moreImages.addEventListener("click", loadMoreImages);
  if (bird.images.length > 1) {
    mediaColumn.append(gallery, moreImages);
    loadMoreImages();
  }
  if (bird.images.length > 1) {
    const caption = document.createElement("p");
    caption.className = "media-caption";
    caption.textContent = `${bird.images.length} imagens disponíveis; a galeria carrega 12 por vez.`;
    mediaColumn.append(caption);
  }
  const audioColumn = document.createElement("section");
  audioColumn.className = "audio-panel";
  const audioTitle = document.createElement("h2");
  audioTitle.textContent = "Gravações";
  audioColumn.append(audioTitle);
  if (!bird.audios.length) {
    const noAudio = document.createElement("p");
    noAudio.className = "muted-note";
    noAudio.textContent = "Nenhuma gravação desta espécie foi incluída no pacote de demonstração.";
    audioColumn.append(noAudio);
  }
  for (const audioPath of bird.audios) {
    const audioBox = document.createElement("div");
    audioBox.className = "audio-item";
    const audio = document.createElement("audio");
    audio.controls = true;
    audio.preload = "none";
    audio.src = mediaUrl(audioPath);
    const match = audioPath.match(/_(\d+)\.(?:mp3|ogg|wav|m4a|flac)$/i);
    if (match) {
      const credit = document.createElement("a");
      credit.href = `https://xeno-canto.org/${match[1]}`;
      credit.target = "_blank";
      credit.rel = "noreferrer";
      credit.textContent = `Abrir origem Xeno-Canto XC${match[1]}`;
      credit.className = "source-link";
      audioBox.append(audio, credit);
    } else audioBox.append(audio);
    audioColumn.append(audioBox);
  }
  const datasetInfo = document.createElement("section");
  datasetInfo.className = "dataset-info";
  const infoTitle = document.createElement("h2");
  infoTitle.textContent = "No conjunto de dados";
  const info = document.createElement("p");
  info.textContent = `Identificador CUB: ${bird.id}. O catálogo completo contém 200 espécies; esta exportação traz ${bird.images.length} imagem(ns) e ${bird.audios.length} gravação(ões) para esta espécie.`;
  datasetInfo.append(infoTitle, info);
  layout.append(mediaColumn, audioColumn, datasetInfo);
  detailContent.append(heading, layout);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function refreshSearch() {
  const query = birdKey(input.value);
  if (!query) { renderCards([...tree.inOrder()]); setTreeStatus(); return; }
  const exact = tree.search(input.value.trim());
  if (exact) setTreeStatus(`busca exata por ${exact.species}`);
  else setTreeStatus(`busca parcial por “${input.value.trim()}”`);
  const found = [...tree.inOrder()].filter((bird) => birdKey(`${bird.species} ${bird.originalLabel || ""}`).includes(query));
  renderCards(found);
}

document.querySelector("#btn-voltar").addEventListener("click", () => {
  stopAudioElements(detailContent);
  detailPage.hidden = true;
  catalogPage.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
});

window.addEventListener("pagehide", () => stopAudioElements(detailContent));

input.addEventListener("input", refreshSearch);

try {
  const response = await fetch("/api/catalog", { cache: "no-store" });
  if (!response.ok) throw new Error(`Servidor respondeu ${response.status}`);
  const data = await response.json();
  birds = data.birds;
  for (const bird of birds) tree.insert(bird);
  if (data.source === "demo") {
    sourceBadge.textContent = "amostra local";
    sourceBadge.hidden = false;
    sourceBadge.title = "O pacote processado não estava disponível; catálogo local carregado.";
  }
  renderCards([...tree.inOrder()]);
  setTreeStatus();
} catch (error) {
  rootDisplay.textContent = "Não foi possível carregar o catálogo.";
  resultCount.textContent = "Confira se o servidor Node.js está em execução.";
  console.error("Erro ao carregar catálogo:", error);
}
