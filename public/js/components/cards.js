import { esc, placeholder } from "../core/util.js";
import { mediaUrl } from "../data/catalog.js";

const IMG_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="M4 18l5-5 4 4 3-3 4 4"/></svg>';

/** Imagem da ave (ou espaço reservado quando não há foto). */
export function birdImage(bird, index = 0, note) {
  const path = bird.images[index];
  return path
    ? `<img src="${mediaUrl(path)}" alt="${esc(bird.species)}" loading="lazy">`
    : placeholder(note);
}

/**
 * Cartão de ave: foto + nome.
 *   href   para onde o clique leva
 *   rank   posição (só nas "mais pesquisadas")
 *   badge  texto do selo (ex.: "48 fotos"), usado nas galerias
 */
export function miniCard(bird, { href, rank, badge } = {}) {
  return `<li><a class="mini" href="${href}">
    <div class="art">
      ${rank ? `<span class="rank" aria-label="${rank}º mais pesquisada">${rank}</span>` : ""}
      ${birdImage(bird)}
      ${badge ? `<span class="badge">${IMG_ICON}${badge}</span>` : ""}
    </div>
    <h3 class="name">${esc(bird.species)}</h3></a></li>`;
}
