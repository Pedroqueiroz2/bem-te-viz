import { test } from "node:test";
import assert from "node:assert/strict";
import { SplayTree } from "../../src/splay-tree.js";
import { FrequencyList, RecentList, DoublyLinkedList } from "../../src/lists.js";

/*
 * Testes pesados das estruturas: muitos dados, sequências aleatórias e
 * comparação com um "gabarito" simples (Map/array do JavaScript, usado só aqui
 * dentro do teste) para provar que a implementação não perde nem troca nada.
 * Rodam com `npm run test:heavy`.
 */

/** Gerador pseudoaleatório previsível (mesma semente, mesma sequência). */
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}
const key = (i) => `k${String(i).padStart(7, "0")}`;
const bird = (species) => ({ species, image: "", audio: "" });
const timed = (fn) => { const t0 = performance.now(); const result = fn(); return { result, ms: performance.now() - t0 }; };

/** Confere a ordem alfabética, a ausência de repetidos e o tamanho. */
function assertOrdered(tree, expectedSize) {
  const species = [...tree.inOrder()].map((b) => b.species);
  assert.equal(species.length, expectedSize, "tamanho");
  for (let i = 1; i < species.length; i++) assert.ok(species[i - 1] < species[i], `fora de ordem em ${species[i - 1]} / ${species[i]}`);
  return species;
}

/* ===================== Árvore Afunilada ===================== */

test("árvore vazia: todas as operações são seguras", () => {
  const t = new SplayTree();
  assert.equal(t.size, 0);
  assert.equal(t.height(), 0);
  assert.equal(t.rootSpecies, null);
  assert.equal(t.search("x"), undefined);
  assert.equal(t.peek("x"), undefined);
  assert.equal(t.depth("x"), -1);
  assert.equal(t.getAccessCount("x"), 0);
  assert.deepEqual([...t.inOrder()], []);
  assert.deepEqual(t.searchPrefix("a"), []);
});

test("chaves que só diferem em maiúscula, acento ou sublinhado são o mesmo nó", () => {
  const t = new SplayTree();
  t.insert(bird("Black_footed Albatross"));
  t.insert(bird("black footed albatross"));
  t.insert(bird("BLACK  FOOTED ALBATROSS"));
  t.insert(bird("Sabiá"));
  t.insert(bird("sabia"));
  assert.equal(t.size, 2);
  assert.equal(t.search("SABIÁ").species, "sabia");   // a última inserção atualiza o valor
});

test("20 mil operações aleatórias: ordem, tamanho e contadores batem com o gabarito", () => {
  const rnd = rng(42);
  const tree = new SplayTree();
  const model = new Map();   // gabarito: chave -> contador
  let successfulSearches = 0;

  for (let op = 1; op <= 20000; op++) {
    const k = key(Math.floor(rnd() * 3000));
    const roll = rnd();
    if (roll < 0.35) {
      tree.insert(bird(k));
      if (!model.has(k)) model.set(k, 1);
    } else if (roll < 0.9) {
      const found = tree.search(k);
      assert.equal(found !== undefined, model.has(k), `presença de ${k}`);
      if (found) { model.set(k, model.get(k) + 1); successfulSearches++; }
    } else {
      assert.equal(tree.peek(k) !== undefined, model.has(k), `peek de ${k}`);
    }
    if (op % 2500 === 0) assertOrdered(tree, model.size);
  }

  const species = assertOrdered(tree, model.size);
  assert.deepEqual(species, [...model.keys()].sort());
  let totalExtra = 0;
  let max = 0;
  for (const [k, count] of model) {
    assert.equal(tree.getAccessCount(k), count, `contador de ${k}`);
    totalExtra += count - 1;
    max = Math.max(max, count);
  }
  assert.equal(totalExtra, successfulSearches, "cada busca com sucesso soma exatamente 1 ao contador");
  assert.equal(tree.rootAccessCount, max, "a raiz tem sempre o maior contador");
});

test("modificação: depois de qualquer busca, a ave está na raiz ou logo abaixo dela", () => {
  const rnd = rng(7);
  const tree = new SplayTree();
  for (let i = 0; i < 1500; i++) tree.insert(bird(key(i)));
  for (let n = 0; n < 6000; n++) {
    // 70% dos acessos vão para poucas aves "populares"; o resto é espalhado
    const k = key(rnd() < 0.7 ? Math.floor(rnd() * 20) : Math.floor(rnd() * 1500));
    tree.search(k);
    const depth = tree.depth(k);
    assert.ok(depth === 0 || depth === 1, `${k} ficou no nível ${depth}`);
    if (depth === 1) assert.ok(tree.getAccessCount(k) < tree.rootAccessCount, "só fica no nível 1 se o contador é menor que o da raiz");
    else assert.equal(tree.rootSpecies, k);
  }
  // as populares acabam no topo: a raiz é uma delas
  assert.ok(Number(tree.rootSpecies.slice(1)) < 20, `raiz: ${tree.rootSpecies}`);
});

test("buscas por chaves inexistentes não alteram contadores nem a ordem", () => {
  const tree = new SplayTree();
  for (let i = 0; i < 800; i += 2) tree.insert(bird(key(i)));   // só pares
  for (let i = 0; i < 800; i += 2) tree.search(key(i));
  const before = [...tree.inOrder()].map((b) => [b.species, tree.getAccessCount(b.species)]);
  for (let i = 1; i < 800; i += 2) assert.equal(tree.search(key(i)), undefined);   // ímpares: ausentes
  assert.equal(tree.size, 400);
  assert.deepEqual([...tree.inOrder()].map((b) => [b.species, tree.getAccessCount(b.species)]), before);
});

test("100 mil inserções aleatórias e 100 mil buscas em tempo razoável", () => {
  const rnd = rng(99);
  const tree = new SplayTree();
  const insert = timed(() => { for (let i = 0; i < 100000; i++) tree.insert(bird(key(Math.floor(rnd() * 1e7)))); });
  const search = timed(() => { for (let i = 0; i < 100000; i++) tree.search(key(Math.floor(rnd() * 1e7))); });
  assert.ok(insert.ms < 8000, `inserir levou ${Math.round(insert.ms)} ms`);
  assert.ok(search.ms < 8000, `buscar levou ${Math.round(search.ms)} ms`);
  assertOrdered(tree, tree.size);
});

test("100 mil chaves em ordem (pior caso para árvore comum): sem estourar a pilha e rápido", () => {
  const tree = new SplayTree();
  const n = 100000;
  const insert = timed(() => { for (let i = 0; i < n; i++) tree.insert(bird(key(i))); });
  assert.ok(insert.ms < 8000, `inserir levou ${Math.round(insert.ms)} ms`);
  assert.equal(tree.size, n);
  assert.equal(tree.height(), n, "inserção em ordem forma uma cadeia (altura n), e height() não estoura");
  assert.equal(tree.depth(key(0)), n - 1);
  // acesso sequencial: o custo total continua baixo (propriedade da Splay Tree)
  const sequential = timed(() => { for (let i = 0; i < n; i++) assert.ok(tree.search(key(i))); });
  assert.ok(sequential.ms < 8000, `acesso sequencial levou ${Math.round(sequential.ms)} ms`);
  assert.equal(tree.rootSpecies, key(n - 1), "a última ave acessada fica na raiz");
  assertOrdered(tree, n);
  for (const i of [0, 1234, 50000, n - 1]) assert.equal(tree.getAccessCount(key(i)), 2, "cada ave foi acessada uma vez");
});

test("busca por prefixo em 100 mil nós confere com a força bruta e é mais rápida", () => {
  const rnd = rng(5);
  const tree = new SplayTree();
  const all = new Set();
  for (let i = 0; i < 100000; i++) {
    const k = key(Math.floor(rnd() * 5e6));
    tree.insert(bird(k));
    all.add(k);
  }
  const sorted = [...all].sort();
  const prefixes = Array.from({ length: 60 }, () => key(Math.floor(rnd() * 5e6)).slice(0, 5 + Math.floor(rnd() * 3)));
  for (const prefix of prefixes) {
    assert.deepEqual(tree.searchPrefix(prefix).map((b) => b.species), sorted.filter((s) => s.startsWith(prefix)), `prefixo ${prefix}`);
  }
  // prefixo estreito (poucos resultados): a árvore só visita a faixa, a força bruta varre tudo
  const narrow = prefixes.map((p) => p.slice(0, 7).padEnd(8, "0").slice(0, 8)).filter((p) => p.length === 8);
  const viaTree = timed(() => { for (let r = 0; r < 20; r++) for (const p of narrow) tree.searchPrefix(p); });
  const brute = timed(() => { for (let r = 0; r < 20; r++) for (const p of narrow) sorted.filter((s) => s.startsWith(p)); });
  assert.ok(viaTree.ms * 3 < brute.ms, `árvore ${Math.round(viaTree.ms)} ms contra força bruta ${Math.round(brute.ms)} ms`);
});

test("remoção: 30 mil operações aleatórias (inserir, buscar, remover) batem com o gabarito", () => {
  const rnd = rng(2024);
  const tree = new SplayTree();
  const model = new Map();   // gabarito: chave -> contador
  let rootRemovals = 0;

  for (let op = 1; op <= 30000; op++) {
    const k = key(Math.floor(rnd() * 2000));
    const roll = rnd();
    if (roll < 0.35) {
      tree.insert(bird(k));
      if (!model.has(k)) model.set(k, 1);
    } else if (roll < 0.7) {
      if (tree.search(k)) model.set(k, model.get(k) + 1);
    } else {
      const rootBefore = tree.rootSpecies;
      // metade das remoções mira a própria raiz, para exercitar o caso mais delicado
      const target = rnd() < 0.5 && rootBefore ? rootBefore : k;
      const removed = tree.remove(target);
      assert.equal(removed !== undefined, model.has(target), `remover ${target}`);
      if (removed) {
        const k2 = target;
        model.delete(k2);
        if (model.size === 0) assert.equal(tree.rootSpecies, null);
        else if (k2 !== rootBefore) assert.equal(tree.rootSpecies, rootBefore, "remover um nó que não é a raiz preserva a raiz");
        else {
          rootRemovals++;
          const smaller = [...model.keys()].filter((x) => x < k2);
          if (smaller.length) assert.equal(tree.rootSpecies, smaller.sort().pop(), "nova raiz é a antecessora");
          else assert.ok(tree.rootSpecies > k2, "sem esquerda, a nova raiz vem da direita");
        }
      }
    }
    if (op % 3000 === 0) assertOrdered(tree, model.size);
  }

  assert.ok(rootRemovals > 100, `removeu a raiz ${rootRemovals} vezes`);
  assert.deepEqual(assertOrdered(tree, model.size), [...model.keys()].sort());
  for (const [k, count] of model) assert.equal(tree.getAccessCount(k), count, `contador de ${k}`);
  for (const k of [...model.keys()].slice(0, 1500)) {
    tree.search(k);
    const depth = tree.depth(k);
    assert.ok(depth === 0 || depth === 1, `${k} no nível ${depth} depois das remoções`);
  }
  assert.equal(tree.size, model.size);
});

test("remoção: tirar 100 mil nós, em ordem e em ordem aleatória, esvazia a árvore em tempo razoável", () => {
  const n = 100000;
  for (const shuffled of [false, true]) {
    const rnd = rng(77);
    const order = Array.from({ length: n }, (_, i) => i);
    if (shuffled) for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    const tree = new SplayTree();
    for (let i = 0; i < n; i++) tree.insert(bird(key(i)));
    const { ms } = timed(() => {
      for (let step = 0; step < n; step++) assert.equal(tree.remove(key(order[step])).species, key(order[step]));
    });
    assert.ok(ms < 8000, `${shuffled ? "aleatória" : "em ordem"}: levou ${Math.round(ms)} ms`);
    assert.equal(tree.size, 0);
    assert.equal(tree.height(), 0);
    assert.equal(tree.rootSpecies, null);
  }
});

test("remoção: depois de remover metade dos nós, a ordem e a busca por prefixo continuam corretas", () => {
  const tree = new SplayTree();
  for (let i = 0; i < 50000; i++) tree.insert(bird(key(i)));
  for (let i = 0; i < 50000; i += 2) tree.remove(key(i));   // tira os pares
  assert.equal(tree.size, 25000);
  const species = assertOrdered(tree, 25000);
  assert.ok(species.every((s) => Number(s.slice(1)) % 2 === 1), "só sobraram os ímpares");
  assert.equal(tree.searchPrefix("k00001").length, 50, "k00001 cobre os números 100 a 199: sobram os 50 ímpares");
});

/* ===================== Listas encadeadas ===================== */

test("FrequencyList: 20 mil acessos aleatórios batem com o gabarito e ficam em ordem decrescente", () => {
  const rnd = rng(11);
  const list = new FrequencyList();
  const counts = new Map();
  let model = [];   // gabarito: [{ value, count }] — mesma regra, mas num array
  for (let op = 0; op < 20000; op++) {
    // alguns valores são muito mais acessados que outros
    const v = `v${Math.floor(rnd() < 0.6 ? rnd() * 10 : rnd() * 300)}`;
    const count = (counts.get(v) ?? 1) + 1;
    counts.set(v, count);
    list.access(v, count);

    model = model.filter((e) => e.value !== v);
    let at = 0;
    while (at < model.length && model[at].count >= count) at++;
    model.splice(at, 0, { value: v, count });

    if (op < 1500 || op % 500 === 0) assert.deepEqual(list.toArray(), model.map((e) => e.value), `depois da operação ${op}`);
  }
  assert.equal(list.size, counts.size);
  const finalCounts = list.toArray().map((v) => counts.get(v));
  assert.deepEqual(finalCounts, [...finalCounts].sort((a, b) => b - a), "contadores em ordem decrescente");
  assert.equal(new Set(list.toArray()).size, list.size, "sem repetidos");
});

test("FrequencyList: 3 mil valores distintos em tempo razoável", () => {
  const list = new FrequencyList();
  const { ms } = timed(() => {
    for (let round = 0; round < 3; round++) for (let i = 0; i < 3000; i++) list.access(`v${i}`, round + 2);
  });
  assert.equal(list.size, 3000);
  assert.ok(ms < 5000, `levou ${Math.round(ms)} ms`);
});

for (const limit of [1, 5, 12, 50]) {
  test(`RecentList (limite ${limit}): 20 mil operações batem com o gabarito`, () => {
    const rnd = rng(limit * 31);
    const list = new RecentList(limit);
    let model = [];
    for (let op = 0; op < 20000; op++) {
      if (rnd() < 0.01) {
        list.clear();
        model = [];
      } else {
        const v = `v${Math.floor(rnd() * (limit * 3))}`;
        list.add(v);
        model = [v, ...model.filter((x) => x !== v)].slice(0, limit);
      }
      assert.deepEqual(list.toArray(), model, `depois da operação ${op}`);
      assert.equal(list.size, model.length);
      assert.ok(list.size <= limit);
    }
  });
}

test("DoublyLinkedList: 200 mil nós, ida e volta consistentes", () => {
  const list = new DoublyLinkedList();
  const n = 200000;
  for (let i = 0; i < n; i++) list.append(`v${i}`);
  assert.equal(list.size, n);

  const forward = [];
  for (let node = list.find("v0"); node !== null; node = node.next) forward.push(node.value);
  const backward = [];
  for (let node = list.find(`v${n - 1}`); node !== null; node = node.prev) backward.push(node.value);
  assert.equal(forward.length, n);
  assert.deepEqual(backward.reverse(), forward, "voltar pelos `prev` dá a mesma ordem");
  assert.equal(list.find("v0").prev, null);
  assert.equal(list.find(`v${n - 1}`).next, null);
  assert.equal(list.find("inexistente"), null);
  assert.equal(new DoublyLinkedList().find("x"), null);

  const rnd = rng(3);
  for (let i = 0; i < 200; i++) {
    const k = Math.floor(rnd() * n);
    const node = list.find(`v${k}`);
    assert.equal(node.prev?.value, k === 0 ? undefined : `v${k - 1}`);
    assert.equal(node.next?.value, k === n - 1 ? undefined : `v${k + 1}`);
  }
});

test("listas: remoções aleatórias batem com o gabarito (FrequencyList, RecentList, DoublyLinkedList)", () => {
  const rnd = rng(8);
  const freq = new FrequencyList();
  const recent = new RecentList(20);
  const dll = new DoublyLinkedList();
  const counts = new Map();
  let freqModel = [];
  let recentModel = [];
  let dllModel = [];

  for (let i = 0; i < 300; i++) { dll.append(`v${i}`); dllModel.push(`v${i}`); }

  for (let op = 0; op < 15000; op++) {
    const v = `v${Math.floor(rnd() * 300)}`;
    if (rnd() < 0.3) {
      assert.equal(freq.remove(v), counts.has(v));
      counts.delete(v);
      freqModel = freqModel.filter((e) => e.value !== v);
      recent.remove(v);
      recentModel = recentModel.filter((x) => x !== v);
      assert.equal(dll.remove(v), dllModel.includes(v));
      dllModel = dllModel.filter((x) => x !== v);
    } else {
      const count = (counts.get(v) ?? 1) + 1;
      counts.set(v, count);
      freq.access(v, count);
      freqModel = freqModel.filter((e) => e.value !== v);
      let at = 0;
      while (at < freqModel.length && freqModel[at].count >= count) at++;
      freqModel.splice(at, 0, { value: v, count });
      recent.add(v);
      recentModel = [v, ...recentModel.filter((x) => x !== v)].slice(0, 20);
    }
    if (op % 250 === 0) {
      assert.deepEqual(freq.toArray(), freqModel.map((e) => e.value));
      assert.deepEqual(recent.toArray(), recentModel);
      assert.deepEqual(dll.toArray(), dllModel);
    }
  }
  assert.deepEqual(freq.toArray(), freqModel.map((e) => e.value));
  assert.deepEqual(recent.toArray(), recentModel);
  assert.deepEqual(dll.toArray(), dllModel);
  assert.equal(freq.size, freqModel.length);
  assert.equal(dll.size, dllModel.length);
  // ligações da lista dupla íntegras depois de tantas remoções
  const backward = [];
  for (let node = dll.find(dllModel.at(-1)); node !== null; node = node.prev) backward.push(node.value);
  assert.deepEqual(backward.reverse(), dllModel);
});
