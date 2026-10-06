import { esc } from "../core/util.js";
import { tree } from "../data/catalog.js";

let badge = null;

/** Cria o bloquinho no canto superior direito (uma vez por página). */
export function mountTreeBadge() {
  if (badge) return;
  badge = document.createElement("aside");
  badge.className = "tree-badge";
  badge.setAttribute("aria-label", "Estado da árvore afunilada");
  document.body.append(badge);
  updateTreeBadge();
}

/**
 * Mostra a raiz da árvore e o contador de acessos dela.
 * Com `name`, mostra também o contador e o nível da ave aberta.
 */
export function updateTreeBadge(name) {
  if (!badge) return;
  const root = tree.rootSpecies;
  let html = `<small>Árvore afunilada</small>
    <b>Raiz: ${root ? esc(root) : "vazia"}</b>
    <span>contador ${tree.rootAccessCount} · ${tree.size} aves</span>`;
  if (name) {
    const depth = tree.depth(name);
    html += `<span class="tb-cur">Esta ave: contador ${tree.getAccessCount(name)} · ${depth === 0 ? "na raiz" : `nível ${depth}`}</span>`;
  }
  badge.innerHTML = html;
}
