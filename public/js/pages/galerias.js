import "../core/layout.js";
import { $, norm, esc, fotos } from "../core/util.js";
import { ready, allBirds, openBird, topBirds, mediaUrl, galleryHref } from "../data/catalog.js";
import { miniCard } from "../components/cards.js";


const card = (bird, rank) => miniCard(bird, { href: galleryHref(bird), rank, badge: fotos(bird.images.length) });

/* ---- Lista ---- */
function renderAll() {
  const term = norm($("q").value);
  const list = [];
  for (const bird of allBirds()) {
    if (term && !norm(`${bird.species} ${bird.originalLabel || ""}`).includes(term)) continue;
    list.push(bird);
  }
  $("all").innerHTML = list.map((bird) => card(bird)).join("");
  $("all").hidden = !list.length;
  $("empty").hidden = !!list.length;
  const n = list.length;
  $("count").innerHTML = `<strong>${n}</strong> ${n === 1 ? "galeria" : "galerias"}${term ? ` para “${esc($("q").value.trim())}”` : ""}`;
  const top = topBirds(4);
  $("top4").innerHTML = top.map((bird, i) => card(bird, i + 1)).join("");
  $("secTop").hidden = !!term || !top.length;
}
$("q").addEventListener("input", renderAll);
$("form").addEventListener("submit", (e) => { e.preventDefault(); renderAll(); $("secAll").scrollIntoView({ behavior: "smooth" }); });

/* ---- Galeria da ave: todas as fotos em grade ---- */
function openGallery(name) {
  const bird = openBird(name);   // busca na árvore (afunila) e conta como acesso
  if (!bird) { location.hash = "#/"; return; }
  const n = bird.images.length;
  document.title = `${bird.species} · Galeria · Bem-te-viz`;
  $("gName").textContent = bird.species;
  $("gSub").textContent = n ? fotos(n) : "Sem fotos nesta amostra";
  $("photoGrid").innerHTML = bird.images.map((path, k) =>
    `<li><a href="${mediaUrl(path)}" target="_blank" rel="noopener" aria-label="Abrir a foto ${k + 1} em tamanho original"><img src="${mediaUrl(path)}" alt="${esc(bird.species)}, foto ${k + 1}" loading="lazy"></a></li>`).join("");
  $("gEmpty").hidden = n > 0;
}

/* ---- Navegação: #/ (lista) e #/galeria/<nome>/<foto> ---- */
function route() {
  const m = location.hash.match(/^#\/galeria\/([^/]+)/);
  $("viewList").hidden = !!m;
  $("viewGallery").hidden = !m;
  if (m) {
    openGallery(decodeURIComponent(m[1]));
  } else {
    document.title = "Galerias · Bem-te-viz";
    renderAll();
  }
  window.scrollTo(0, 0);
}

ready.then(() => {
  window.addEventListener("hashchange", route);
  route();
}).catch((error) => {
  $("count").textContent = `Não foi possível carregar o catálogo: ${error.message}`;
});
