import "../core/layout.js";
import { $, norm, fmt, rng, esc, fotos, plural } from "../core/util.js";
import {
  ready, meta, allBirds, openBird, topBirds, recentBirds, clearRecent, mediaUrl, speciesHref, galleryHref,
} from "../data/catalog.js";
import { miniCard, birdImage } from "../components/cards.js";
import { playAudio, audioDuration } from "../components/audio.js";

const BARS = 56;
const FILTERS = [["todas", "Todas"], ["foto", "Com foto"], ["audio", "Com áudio"]];
let filter = "todas";
let stopFn = null;
let current = null;

const card = (bird, rank) => miniCard(bird, { href: speciesHref(bird), rank });

/* ---- Lista ---- */
$("chips").setAttribute("aria-label", "Filtrar espécies");
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
    if (filter === "audio" && !bird.audios.length) continue;
    if (term && !norm(`${bird.species} ${bird.originalLabel || ""}`).includes(term)) continue;
    list.push(bird);
  }
  $("all").innerHTML = list.map((bird) => card(bird)).join("");
  $("all").hidden = !list.length;
  $("empty").hidden = !!list.length;
  const n = list.length;
  const label = FILTERS.find(([id]) => id === filter)[1].toLowerCase();
  $("count").innerHTML = `<strong>${n}</strong> ${n === 1 ? "espécie" : "espécies"}${filter !== "todas" ? ` (${label})` : ""}${term ? ` para “${esc($("q").value.trim())}”` : ""}`;
  const top = topBirds(4);
  $("top4").innerHTML = top.map((bird, i) => card(bird, i + 1)).join("");
  $("secTop").hidden = !!term || filter !== "todas" || !top.length;
}
$("q").addEventListener("input", renderAll);
$("form").addEventListener("submit", (e) => { e.preventDefault(); renderAll(); $("secAll").scrollIntoView({ behavior: "smooth" }); });

/* ---- Áudio da espécie aberta ---- */
function setProgress(p, el, total) {
  const on = Math.round(p * BARS);
  $("spWave").querySelectorAll("b").forEach((b, i) => b.classList.toggle("on", i < on));
  $("spTime").textContent = `${fmt(el)}${Number.isFinite(total) ? ` / ${fmt(total)}` : ""}`;
}
function resetAudio() {
  if (stopFn) { stopFn(); stopFn = null; }
  $("spListen").classList.remove("is-playing");
  $("bigplay").setAttribute("aria-pressed", "false");
  $("spWave").querySelectorAll("b").forEach((b) => b.classList.remove("on"));
}
$("bigplay").addEventListener("click", () => {
  if (stopFn) { resetAudio(); return; }
  if (!current?.audios.length) return;
  stopFn = playAudio(mediaUrl(current.audios[0]), { onProgress: setProgress, onEnd: resetAudio });
  $("spListen").classList.add("is-playing");
  $("bigplay").setAttribute("aria-pressed", "true");
});

/* ---- Página da espécie + histórico ---- */
function renderHist(currentName) {
  const birds = recentBirds().filter((b) => b.species !== currentName);
  $("secHist").hidden = !birds.length;
  $("hist").innerHTML = birds.map((b) => card(b)).join("");
}

function openSpecies(name) {
  resetAudio();
  const before = recentBirds();           // histórico antes desta visita
  const bird = openBird(name);            // busca na árvore (afunila) e registra nas listas
  if (!bird) { location.hash = "#/"; return; }
  current = bird;

  document.title = `${bird.species} · Bem-te-viz`;
  $("spName").textContent = bird.species;
  $("spSub").textContent = `${bird.originalLabel ? `Rótulo CUB: ${bird.originalLabel} · ` : ""}${fotos(bird.images.length)} · ${plural(bird.audios.length, "áudio", "áudios")}`;
  $("spPhoto").innerHTML = birdImage(bird);
  $("spGallery").href = galleryHref(bird);
  $("spGallery").hidden = !bird.images.length;

  const r = rng(bird.species);
  let prev = .5;
  $("spWave").innerHTML = Array.from({ length: BARS }, () => {
    prev = Math.min(1, Math.max(.16, prev * .45 + r() * .65));
    return `<b style="height:${Math.round(prev * 100)}%"></b>`;
  }).join("");

  const hasAudio = bird.audios.length > 0;
  $("bigplay").disabled = !hasAudio;
  $("bigplay").setAttribute("aria-label", hasAudio ? `Ouvir o canto: ${bird.species}` : "Sem gravação disponível");
  $("spNote").hidden = hasAudio;
  $("spTime").textContent = "0:00";
  if (hasAudio) {
    audioDuration(mediaUrl(bird.audios[0])).then((d) => {
      if (current === bird && !stopFn && Number.isFinite(d) && d > 0) $("spTime").textContent = `0:00 / ${fmt(d)}`;
    });
  }

  const others = before.filter((b) => b.species !== bird.species);
  $("secHist").hidden = !others.length;
  $("hist").innerHTML = others.map((b) => card(b)).join("");
}
$("clearHist").addEventListener("click", () => { clearRecent(); renderHist(current?.species); });

/* ---- Navegação: #/ (lista) e #/especie/<nome> ---- */
function route() {
  const m = location.hash.match(/^#\/especie\/(.+)$/);
  $("viewList").hidden = !!m;
  $("viewSpecies").hidden = !m;
  if (m) {
    openSpecies(decodeURIComponent(m[1]));
  } else {
    resetAudio();
    current = null;
    document.title = "Espécies · Bem-te-viz";
    renderAll();
  }
  window.scrollTo(0, 0);
}

ready.then(() => {
  const q = new URLSearchParams(location.search).get("q");
  if (q) $("q").value = q;
  window.addEventListener("hashchange", route);
  route();
}).catch((error) => {
  $("count").textContent = `Não foi possível carregar o catálogo: ${error.message}`;
});
