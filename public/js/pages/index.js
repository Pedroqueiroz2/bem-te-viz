import "../core/layout.js";
import { $, esc, fmt, placeholder } from "../core/util.js";
import { ready, allBirds, topBirds, mediaUrl, speciesHref } from "../data/catalog.js";
import { miniCard } from "../components/cards.js";
import { playAudio } from "../components/audio.js";

const PLAY = '<svg class="i-play" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>'
  + '<svg class="i-pause" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4.5" width="4" height="15" rx="1"/><rect x="14" y="4.5" width="4" height="15" rx="1"/></svg>';

const thumb = (bird, i = 0) => (bird?.images[i]
  ? `<img src="${mediaUrl(bird.images[i])}" alt="${esc(bird.species)}">`
  : placeholder(""));

/** Primeiras `n` aves (em ordem alfabética) que atendem ao critério. */
function pick(n, test) {
  const out = [];
  for (const bird of allBirds()) {
    if (!test(bird)) continue;
    out.push(bird);
    if (out.length === n) break;
  }
  return out;
}

ready.then(() => {
  const withImage = pick(4, (b) => b.images.length);

  // ilustração do topo e miniaturas dos atalhos usam fotos reais do catálogo
  $("heroArt").innerHTML = withImage[0] ? thumb(withImage[0]) : placeholder("Sem fotos nesta amostra");
  document.querySelectorAll(".sc-art").forEach((el, i) => { el.innerHTML = thumb(withImage[i + 1] ?? withImage[0]); });

  // destaque: as mais pesquisadas; enquanto não há visitas, as primeiras com foto
  const top = topBirds(4);
  const destaque = top.length ? top : withImage;
  $("destaque").innerHTML = destaque.map((bird, i) => miniCard(bird, { href: speciesHref(bird), rank: top.length ? i + 1 : undefined })).join("");

  // mini players: aves que têm gravação
  const singers = pick(4, (b) => b.audios.length);
  const players = $("players");
  if (!singers.length) {
    players.innerHTML = '<li class="mp-empty">Nenhuma gravação na amostra local.</li>';
    return;
  }
  players.innerHTML = singers.map((bird, i) => `<li class="mp" data-i="${i}">
    <button class="mp-btn" type="button" aria-label="Ouvir ${esc(bird.species)}">${PLAY}</button>
    <a class="mp-name" href="${speciesHref(bird)}">${esc(bird.species)}</a>
    <span class="mp-time">0:00</span></li>`).join("");

  let stop = null;
  let active = null;
  const reset = () => {
    if (stop) { stop(); stop = null; }
    if (active) { active.classList.remove("is-playing"); active.querySelector(".mp-time").textContent = "0:00"; active = null; }
  };
  players.addEventListener("click", (e) => {
    const btn = e.target.closest(".mp-btn");
    if (!btn) return;
    const li = btn.closest(".mp");
    const wasActive = li === active;
    reset();
    if (wasActive) return;
    active = li;
    li.classList.add("is-playing");
    stop = playAudio(mediaUrl(singers[+li.dataset.i].audios[0]), {
      onProgress: (_p, el) => { li.querySelector(".mp-time").textContent = fmt(el); },
      onEnd: reset,
    });
  });
}).catch((error) => {
  $("destaque").innerHTML = `<li>Não foi possível carregar o catálogo: ${esc(error.message)}</li>`;
});
