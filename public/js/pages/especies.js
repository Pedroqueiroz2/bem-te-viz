import "../core/layout.js";
import { $, norm, fmt, rng, esc, fotos, plural } from "../core/util.js";
import {
  ready, meta, allBirds, openBird, neighbors, recentBirds, clearRecent, mediaUrl, speciesHref, galleryHref,
} from "../data/catalog.js";
import { miniCard, birdImage } from "../components/cards.js";
import { playAudio, audioDuration } from "../components/audio.js";

const BARS = 56;
let stopFn = null;
let current = null;
let idx = 0;
let track = 0;   // gravação selecionada da ave aberta

const card = (bird, rank) => miniCard(bird, { href: speciesHref(bird), rank });

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
  $("count").innerHTML = `<strong>${n}</strong> ${n === 1 ? "espécie" : "espécies"}${term ? ` para “${esc($("q").value.trim())}”` : ""}`;
  const seen = recentBirds();
  $("recentList").innerHTML = seen.map((bird) => card(bird)).join("");
  $("secRecent").hidden = !!term || !seen.length;
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
  startTrack();
});

function startTrack() {
  stopFn = playAudio(mediaUrl(current.audios[track]), { onProgress: setProgress, onEnd: resetAudio });
  $("spListen").classList.add("is-playing");
  $("bigplay").setAttribute("aria-pressed", "true");
}

/* Várias gravações: lista rolável dentro do mesmo card, clicar escolhe e toca */
function renderTracks() {
  const n = current.audios.length;
  $("spTracks").hidden = n < 2;
  $("spTracks").innerHTML = n < 2 ? "" : current.audios.map((_, k) =>
    `<button class="track" type="button" role="listitem" data-k="${k}" aria-current="${k === track}"><span class="track-n">${k + 1}</span>Gravação ${k + 1}</button>`).join("");
}
$("spTracks").addEventListener("click", (e) => {
  const t = e.target.closest(".track");
  if (!t || !current) return;
  resetAudio();
  track = +t.dataset.k;
  $("spTracks").querySelectorAll(".track").forEach((x) => x.setAttribute("aria-current", String(x === t)));  // sem redesenhar: mantém a rolagem
  startTrack();
});

/* ---- Carrossel de fotos (janela aberta pela foto ou pelas miniaturas) ---- */
const thumbHtml = (bird, k) =>
  `<button class="thumb" type="button" role="listitem" aria-label="Foto ${k + 1}" data-i="${k}"><img src="${mediaUrl(bird.images[k])}" alt="" loading="lazy"><span>${k + 1}</span></button>`;

function show(i, scrollStrip = true) {
  const n = current.images.length;
  idx = Math.min(n - 1, Math.max(0, i));
  $("carStage").innerHTML = `<img src="${mediaUrl(current.images[idx])}" alt="${esc(current.species)}, foto ${idx + 1}">`;
  $("counter").textContent = `${idx + 1} / ${n}`;
  $("prev").disabled = idx === 0;
  $("next").disabled = idx === n - 1;
  $("lbStrip").querySelectorAll(".thumb").forEach((t, k) => t.setAttribute("aria-current", String(k === idx)));
  if (scrollStrip) {
    const t = $("lbStrip").children[idx];
    if (t) $("lbStrip").scrollTo({ left: t.offsetLeft - ($("lbStrip").clientWidth - t.offsetWidth) / 2,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }
}
function openCarousel(i) {
  if (!current?.images.length) return;
  $("lbTitle").textContent = current.species;
  $("lbStrip").innerHTML = current.images.map((_, k) => thumbHtml(current, k)).join("");
  $("lbStrip").hidden = current.images.length < 2;
  const multi = current.images.length > 1;
  $("prev").hidden = $("next").hidden = !multi;
  if (!$("lightbox").open) $("lightbox").showModal();
  show(i, false);
  const t = $("lbStrip").children[idx];
  if (t) $("lbStrip").scrollLeft = Math.max(0, t.offsetLeft - ($("lbStrip").clientWidth - t.offsetWidth) / 2);
}
$("prev").addEventListener("click", () => show(idx - 1));
$("next").addEventListener("click", () => show(idx + 1));
$("lbClose").addEventListener("click", () => $("lightbox").close());
$("lightbox").addEventListener("click", (e) => { if (e.target === $("lightbox")) $("lightbox").close(); });  // clique fora fecha
$("lbStrip").addEventListener("click", (e) => { const t = e.target.closest(".thumb"); if (t) show(+t.dataset.i); });
$("spStrip").addEventListener("click", (e) => { const t = e.target.closest(".thumb"); if (t) openCarousel(+t.dataset.i); });
$("spPhoto").addEventListener("click", (e) => { if (e.target.closest(".photo-open")) openCarousel(0); });
document.addEventListener("keydown", (e) => {
  if (!$("lightbox").open || !current) return;
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
  $("spSub").textContent = `${fotos(bird.images.length)} · ${plural(bird.audios.length, "áudio", "áudios")}`;
  const around = neighbors(bird.species);
  for (const [id, target] of [["prevBird", around.prev], ["nextBird", around.next]]) {
    const link = $(id);
    link.style.visibility = target ? "visible" : "hidden";   // some no começo e no fim da lista
    link.querySelector("b").textContent = target ? target.species : "";
    if (target) link.href = `#/especie/${encodeURIComponent(target.species)}`;
  }

  const n = bird.images.length;
  $("spPhoto").innerHTML = n
    ? `<button class="photo-open" type="button" aria-label="Abrir as fotos de ${esc(bird.species)}">${birdImage(bird)}${n > 1 ? `<span class="badge">${fotos(n)}</span>` : ""}</button>`
    : birdImage(bird);
  $("secPhotos").hidden = n < 2;
  $("spStripHint").textContent = n > 8 ? "Role para o lado e clique em uma foto para ampliar" : "Clique em uma foto para ampliar";
  $("spStrip").innerHTML = bird.images.map((_, k) => thumbHtml(bird, k)).join("");
  $("spGallery").href = galleryHref(bird);
  $("spGallery").hidden = !bird.images.length;

  const r = rng(bird.species);
  let prev = .5;
  $("spWave").innerHTML = Array.from({ length: BARS }, () => {
    prev = Math.min(1, Math.max(.16, prev * .45 + r() * .65));
    return `<b style="height:${Math.round(prev * 100)}%"></b>`;
  }).join("");

  track = 0;
  renderTracks();
  const hasAudio = bird.audios.length > 0;
  $("bigplay").disabled = !hasAudio;
  $("bigplay").setAttribute("aria-label", hasAudio ? `Ouvir o canto: ${bird.species}` : "Sem gravação disponível");
  $("spNote").hidden = hasAudio;
  $("spTime").textContent = "0:00";
  if (hasAudio) {
    audioDuration(mediaUrl(bird.audios[track])).then((d) => {
      if (current === bird && !stopFn && Number.isFinite(d) && d > 0) $("spTime").textContent = `0:00 / ${fmt(d)}`;
    });
  }

  const others = before.filter((b) => b.species !== bird.species);
  $("secHist").hidden = !others.length;
  $("hist").innerHTML = others.map((b) => card(b)).join("");
}
$("clearRecent").addEventListener("click", () => { clearRecent(); renderAll(); });
$("clearHist").addEventListener("click", () => { clearRecent(); renderHist(current?.species); });

/* ---- Navegação: #/ (lista) e #/especie/<nome> ---- */
function route() {
  const m = location.hash.match(/^#\/especie\/(.+)$/);
  if ($("lightbox").open) $("lightbox").close();
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
