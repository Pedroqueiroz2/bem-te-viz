import { SplayTree } from "/src/splay-tree.js";
import { FrequencyList, RecentList, DoublyLinkedList } from "/src/lists.js";
import { birdKey } from "/src/bird.js";
import { store } from "../core/util.js";

const STATE_KEY = "bem-te-viz-state";

/**
 * Estado do uso, guardado no navegador e válido só para a sessão do servidor
 * (cada `npm start` gera uma sessão nova e tudo começa zerado). Recarregar a
 * página mantém tudo: o log de acessos é reproduzido na árvore e nas listas, o
 * que devolve contadores, ranking e histórico exatamente como estavam.
 *   log     nomes das aves abertas, na ordem
 *   cutoff  tamanho do log quando o histórico foi limpado pela última vez
 */
let state = { session: "", log: [], cutoff: 0 };
const saveState = () => store.set(STATE_KEY, state);

/** Um acesso: busca na árvore (afunila) e atualiza as listas. */
function applyAccess(name, toRecent) {
  const bird = tree.search(name);
  if (!bird) return undefined;
  ranking.access(bird.species, tree.getAccessCount(bird.species));   // contador já atualizado pela árvore
  if (toRecent) recent.add(bird.species);
  return bird;
}

/** Hierárquica: guarda todas as aves, chaveadas pelo nome da espécie. */
export const tree = new SplayTree();
/** Linear: ranking "mais pesquisadas" (lista ordenada pelo contador de acessos). */
export const ranking = new FrequencyList();
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

  // sessão nova do servidor = tudo zerado; mesma sessão (F5) = reproduz o que já foi aberto
  const saved = store.get(STATE_KEY, null);
  state = saved?.session === data.session && Array.isArray(saved.log)
    ? saved
    : { session: data.session, log: [], cutoff: 0 };
  state.log.forEach((name, i) => applyAccess(name, i >= state.cutoff));
  saveState();
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

/**
 * Busca da barra de pesquisa. Primeiro vêm as aves cujo nome começa com o texto
 * (busca por prefixo na árvore, que só visita os ramos da faixa); depois, as
 * demais que contêm o texto no nome (varredura em ordem), sem repetir.
 * Não reorganiza a árvore: digitar não conta como acesso.
 */
export function searchBirds(term) {
  const key = birdKey(term);
  const out = tree.searchPrefix(key);
  if (!key) return out;
  for (const bird of tree.inOrder()) {
    const name = birdKey(bird.species);
    if (name.startsWith(key)) continue;   // já veio da busca por prefixo
    if (birdKey(`${bird.species} ${bird.originalLabel || ""}`).includes(key)) out.push(bird);
  }
  return out;
}

/** Abre uma ave: busca na árvore (afunila), registra nas listas e no log da sessão. */
export function openBird(name) {
  const bird = applyAccess(name, true);
  if (!bird) return undefined;
  state.log.push(bird.species);
  saveState();
  return bird;
}

/** Contador de acessos da ave na árvore (sem reorganizar). */
export const accessCount = (name) => tree.getAccessCount(name);

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
  state.cutoff = state.log.length;   // o log antigo não volta para o histórico ao recarregar
  saveState();
}
