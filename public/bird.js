/**
 * @typedef {Object} Bird
 * @property {string} species Nome da espécie, usado como chave de pesquisa.
 * @property {string} image Caminho/URL da imagem (dataset CUB-200-2011).
 * @property {string} audio Caminho/URL do áudio (dataset CUB-200 Bird Audio).
 */

/** Normaliza o nome para comparação: sem acento, minúsculo, espaços simples. */
export function birdKey(species) {
  return species
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[_\s]+/g, " ")
    .trim();
}