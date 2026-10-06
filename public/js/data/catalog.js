import { SplayTree } from "/src/splay-tree.js";
import { TranspositionList, RecentList, DoublyLinkedList } from "/src/lists.js";
import { store } from "../core/util.js";

const RANKING_KEY = "bem-te-viz-ranking";
const RECENT_KEY = "bem-te-viz-recent";

/** Hierárquica: guarda todas as aves, chaveadas pelo nome da espécie. */
export const tree = new SplayTree();
/** Linear: ranking "mais pesquisadas" (lista com transposição). */
export const ranking = new TranspositionList();
/** Linear: histórico "vistas recentemente" (lista com limite). */
export const recent = new RecentList(12);

/** Linear: todas as aves em ordem alfabética, para ir à ave anterior / próxima. */
export const browse = new DoublyLinkedList();

export const meta = { source: "", stats: null };

async function load() {
  const response = await fetch("/api/catalog", { cache: "no-store" });
  if (!response.ok) throw new Error(`Falha ao carregar o catálogo (${response.status})`);
  const data = await response.json();
  for (const bird of data.birds) tree.insert(bird);
  for (const bird of tree.inOrder()) browse.append(bird.species);
  meta.source = data.source;
  meta.stats = data.stats;

  // restaura ranking e histórico salvos neste navegador
  for (const name of store.get(RANKING_KEY, [])) if (tree.peek(name)) ranking.append(name);
  for (const name of store.get(RECENT_KEY, []).reverse()) if (tree.peek(name)) recent.add(name);
}

/** Resolve quando o catálogo está na árvore. */
export const ready = load();

/** URL de uma mídia do catálogo (o servidor entrega em /media/...). */
export function mediaUrl(relativePath) {
  return "/media/" + relativePath.replace(/^media\//, "").split("/").map(encodeURIComponent).join("/");
}

/** Caminhos dentro do app, com o nome da espécie como identificador. */
export const speciesHref = (bird) => `especies.html#/especie/${encodeURIComponent(bird.species)}`;
export const galleryHref = (bird) => `galerias.html#/galeria/${encodeURIComponent(bird.species)}`;

/** Todas as aves em ordem alfabética (percurso em ordem da árvore). */
export function* allBirds() {
  yield* tree.inOrder();
}

/** Abre uma ave: busca na árvore (afunila) e registra nas listas. */
export function openBird(name) {
  const bird = tree.search(name);
  if (!bird) return undefined;
  ranking.access(bird.species);
  recent.add(bird.species);
  store.set(RANKING_KEY, ranking.toArray());
  store.set(RECENT_KEY, recent.toArray());
  return bird;
}

/** Ave anterior e próxima (null no começo e no fim da lista), sem reorganizar a árvore. */
export function neighbors(name) {
  const node = browse.find(name);
  return {
    prev: node?.prev ? tree.peek(node.prev.value) : null,
    next: node?.next ? tree.peek(node.next.value) : null,
  };
}

/** As `n` aves mais pesquisadas, sem reorganizar a árvore. */
export const topBirds = (n) => ranking.take(n).map((name) => tree.peek(name));

/** Aves vistas recentemente (da mais nova para a mais antiga), sem reorganizar a árvore. */
export const recentBirds = () => recent.toArray().map((name) => tree.peek(name));

export function clearRecent() {
  recent.clear();
  store.set(RECENT_KEY, []);
}
