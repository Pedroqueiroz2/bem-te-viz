import "../core/layout.js";
import { $, norm, esc, fotos, placeholder } from "../core/util.js";
import { ready, allBirds, openBird, topBirds, mediaUrl, galleryHref } from "../data/catalog.js";
import { miniCard } from "../components/cards.js";

const FILTERS = [["todas", "Todas"], ["foto", "Com foto"]];
let filter = "todas";
let cur = null;
let idx = 0;

const card = (bird, rank) => miniCard(bird, { href: galleryHref(bird), rank, badge: fotos(bird.images.length) });
const img = (bird, i, cls = "") => `<img${cls ? ` class="${cls}"` : ""} src="${mediaUrl(bird.images[i])}" alt="${esc(bird.species)}, foto ${i + 1}" loading="lazy">`;

/* ---- Lista ---- */
$("chips").setAttribute("aria-label", "Filtrar galerias");
$("chips").innerHTML = FILTERS.map(([id, label]) =>
  `<button class="chip" type="button" data-f="${id}" aria-pressed="${id === filter}">${label}</button>`).join("");
$("chips").addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  filter = chip.dataset.f;
  $("chips").querySelectorAll(".chip").forEach((x) => x.setAttribute("aria-pressed", String(x === chip)));
  renderAll();
});

function renderAll() {
  const term = norm($("q").value);
  const list = [];
  for (const bird of allBirds()) {
    if (filter === "foto" && !bird.images.length) continue;
    if (term && !norm(`${bird.species} ${bird.originalLabel || ""}`).includes(term)) continue;
    list.push(bird);
  }
  $("all").innerHTML = list.map((bird) => card(bird)).join("");
  $("all").hidden = !list.length;
  $("empty").hidden = !!list.length;
  const n = list.length;
  $("count").innerHTML = `<strong>${n}</strong> ${n === 1 ? "galeria" : "galerias"}${filter !== "todas" ? " (com foto)" : ""}${term ? ` para “${esc($("q").value.trim())}”` : ""}`;
  const top = topBirds(4);
  $("top4").innerHTML = top.map((bird, i) => card(bird, i + 1)).join("");
  $("secTop").hidden = !!term || filter !== "todas" || !top.length;
}
$("q").addEventListener("input", renderAll);
$("form").addEventListener("submit", (e) => { e.preventDefault(); renderAll(); $("secAll").scrollIntoView({ behavior: "smooth" }); });

/* ---- Galeria da ave (carrossel + miniaturas) ---- */
function show(i, scrollStrip = true) {
  const n = cur.images.length;
  if (!n) return;
  idx = Math.min(n - 1, Math.max(0, i));
  $("carStage").innerHTML = img(cur, idx);
  $("counter").textContent = `${idx + 1} / ${n}`;
  $("prev").disabled = idx === 0;
  $("next").disabled = idx === n - 1;
  $("strip").querySelectorAll(".thumb").forEach((t, k) => t.setAttribute("aria-current", String(k === idx)));
  if (scrollStrip) {
    const t = $("strip").children[idx];
    if (t) $("strip").scrollTo({ left: t.offsetLeft - ($("strip").clientWidth - t.offsetWidth) / 2,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }
  try { history.replaceState(null, "", `#/galeria/${encodeURIComponent(cur.species)}/${idx + 1}`); } catch { /* sem history */ }
}

function openGallery(name, start) {
  const bird = openBird(name);   // busca na árvore (afunila) e conta como acesso
  if (!bird) { location.hash = "#/"; return; }
  cur = bird;
  const n = bird.images.length;
  document.title = `${bird.species} · Galeria · Bem-te-viz`;
  $("gName").textContent = bird.species;
  $("gSub").textContent = n ? fotos(n) : "Sem fotos nesta amostra";
  $("stripHint").textContent = n > 8 ? "Role para o lado para ver todas" : "";
  $("strip").innerHTML = Array.from({ length: n }, (_, k) =>
    `<button class="thumb" type="button" role="listitem" aria-label="Foto ${k + 1}" data-i="${k}">${img(bird, k)}<span>${k + 1}</span></button>`).join("");
  $("prev").hidden = $("next").hidden = $("counter").hidden = !n;
  if (!n) { $("carStage").innerHTML = placeholder("Esta espécie não tem fotos na amostra local"); return; }
  show(start, false);
  const t = $("strip").children[idx];
  if (t) $("strip").scrollLeft = Math.max(0, t.offsetLeft - ($("strip").clientWidth - t.offsetWidth) / 2);
}

$("prev").addEventListener("click", () => show(idx - 1));
$("next").addEventListener("click", () => show(idx + 1));
$("strip").addEventListener("click", (e) => { const t = e.target.closest(".thumb"); if (t) show(+t.dataset.i); });
document.addEventListener("keydown", (e) => {
  if ($("viewGallery").hidden || !cur || e.target.matches("input")) return;
  if (e.key === "ArrowLeft") show(idx - 1);
  else if (e.key === "ArrowRight") show(idx + 1);
});
let sx = null;   // deslizar o dedo/mouse troca de foto
$("carousel").addEventListener("pointerdown", (e) => { if (!e.target.closest(".nav-btn")) sx = e.clientX; });
$("carousel").addEventListener("pointerup", (e) => {
  if (sx === null) return;
  const d = e.clientX - sx; sx = null;
  if (Math.abs(d) > 40) show(idx + (d < 0 ? 1 : -1));
});

/* ---- Navegação: #/ (lista) e #/galeria/<nome>/<foto> ---- */
function route() {
  const m = location.hash.match(/^#\/galeria\/([^/]+)(?:\/(\d+))?$/);
  const name = m && decodeURIComponent(m[1]);
  $("viewList").hidden = !!m;
  $("viewGallery").hidden = !m;
  if (m) {
    if (!cur || cur.species !== name || !$("strip").children.length) openGallery(name, (+m[2] || 1) - 1);
    else if (+m[2] - 1 !== idx) show((+m[2] || 1) - 1);
  } else {
    cur = null;
    document.title = "Galerias · Bem-te-viz";
    renderAll();
  }
  if (!m || !m[2]) window.scrollTo(0, 0);
}

ready.then(() => {
  window.addEventListener("hashchange", route);
  route();
}).catch((error) => {
  $("count").textContent = `Não foi possível carregar o catálogo: ${error.message}`;
});
