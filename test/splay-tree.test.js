import { test } from "node:test";
import assert from "node:assert/strict";
import { SplayTree } from "../src/splay-tree.js";

const bird = (species) => ({
  species,
  image: `${species}.jpg`,
  audio: `${species}.mp3`,
});

test("insere e pesquisa por espécie", () => {
  const t = new SplayTree();
  for (const s of ["Bem-te-vi", "Tucano", "Arara", "Sabiá"]) t.insert(bird(s));
  assert.equal(t.size, 4);
  assert.equal(t.search("tucano")?.species, "Tucano");
  assert.equal(t.search("Inexistente"), undefined);
});

test("inserção e busca levam o nó para a raiz", () => {
  const t = new SplayTree();
  for (const s of ["a", "b", "c", "d"]) t.insert(bird(s));
  assert.equal(t.rootSpecies, "d");
  t.search("a");
  assert.equal(t.rootSpecies, "a");
});

test("peek não reorganiza a árvore", () => {
  const t = new SplayTree();
  for (const s of ["a", "b", "c"]) t.insert(bird(s));
  t.peek("a");
  assert.equal(t.rootSpecies, "c");
});

test("reinserir mesma espécie atualiza sem duplicar", () => {
  const t = new SplayTree();
  t.insert(bird("Arara"));
  t.insert({ ...bird("arara"), image: "nova.jpg" });
  assert.equal(t.size, 1);
  assert.equal(t.peek("Arara")?.image, "nova.jpg");
});

test("percurso em ordem é ordenado e preserva todos os nós", () => {
  const t = new SplayTree();
  const names = Array.from({ length: 500 }, (_, i) => `ave ${(i * 7919) % 500}`);
  for (const n of names) t.insert(bird(n));
  for (let i = 0; i < 200; i++) t.search(names[(i * 31) % 500]);
  const keys = [...t.inOrder()].map((b) => b.species);
  assert.equal(keys.length, 500);
  assert.deepEqual(keys, [...keys].sort());
});

test("frequência: ave muito acessada permanece na raiz e protege contra acessos esporádicos", () => {
  const t = new SplayTree();
  t.insert(bird("Bem-te-vi"));
  t.insert(bird("Arara"));
  t.insert(bird("Tucano"));
  t.insert(bird("Sabiá"));

  // 1. Acessa "Bem-te-vi" múltiplas vezes para torná-la a ave mais frequente
  for (let i = 0; i < 5; i++) {
    t.search("Bem-te-vi");
  }
  assert.equal(t.rootSpecies, "Bem-te-vi");
  assert.equal(t.depth("Bem-te-vi"), 0);
  assert.equal(t.getAccessCount("Bem-te-vi"), 6); // 1 inserção + 5 buscas

  // 2. Busca esporádica por "Arara" (nó frio com contagem baixa)
  const resultArara = t.search("Arara");
  assert.equal(resultArara?.species, "Arara");
  assert.equal(t.getAccessCount("Arara"), 2); // 1 inserção + 1 busca

  // 3. Verifica que a ave frequente "Bem-te-vi" NÃO foi desalojada da raiz
  assert.equal(t.rootSpecies, "Bem-te-vi");
  assert.equal(t.depth("Bem-te-vi"), 0);

  // 4. "Arara" sofreu splay dentro da subárvore e subiu para profundidade 1 (filho direto)
  assert.equal(t.depth("Arara"), 1);

  // 5. Nova busca por "Bem-te-vi" é O(1) imediata sem rotações
  t.search("Bem-te-vi");
  assert.equal(t.rootSpecies, "Bem-te-vi");
  assert.equal(t.getAccessCount("Bem-te-vi"), 7);
});

test("frequência: ave promove à raiz quando sua contagem iguala ou supera a raiz atual", () => {
  const t = new SplayTree();
  t.insert(bird("Bem-te-vi"));
  t.insert(bird("Tucano"));

  // "Bem-te-vi" atinge contagem 4
  for (let i = 0; i < 3; i++) t.search("Bem-te-vi");
  assert.equal(t.rootSpecies, "Bem-te-vi");
  assert.equal(t.getAccessCount("Bem-te-vi"), 4);

  // "Tucano" tem contagem 1 (inserção). Acessos incrementam:
  t.search("Tucano"); // count = 2 (< 4) -> permanece em profundidade 1
  assert.equal(t.rootSpecies, "Bem-te-vi");
  assert.equal(t.depth("Tucano"), 1);

  t.search("Tucano"); // count = 3 (< 4) -> permanece em profundidade 1
  assert.equal(t.rootSpecies, "Bem-te-vi");
  assert.equal(t.depth("Tucano"), 1);

  // Agora "Tucano" alcança count = 4 (>= 4 da raiz "Bem-te-vi") -> promovido à raiz global!
  t.search("Tucano");
  assert.equal(t.rootSpecies, "Tucano");
  assert.equal(t.depth("Tucano"), 0);
  assert.equal(t.getAccessCount("Tucano"), 4);

  // "Bem-te-vi" agora repousa como filho de "Tucano"
  assert.equal(t.depth("Bem-te-vi"), 1);
});

test("inserção preserva raiz consolidada (count > 1)", () => {
  const t = new SplayTree();
  t.insert(bird("Bem-te-vi"));
  t.search("Bem-te-vi"); // count = 2
  assert.equal(t.rootSpecies, "Bem-te-vi");

  // Inserção de nova ave fria não desalojará "Bem-te-vi"
  t.insert(bird("Canário"));
  assert.equal(t.rootSpecies, "Bem-te-vi");
  assert.equal(t.depth("Bem-te-vi"), 0);
  assert.equal(t.depth("Canário"), 1);
});

/* ---- busca por prefixo ---- */
const names = (list) => list.map((b) => b.species);
const sample = () => {
  const t = new SplayTree();
  for (const s of ["Yellow Warbler", "American Crow", "American Goldfinch", "Sabiá", "Yellow throated Vireo", "Amazon Parrot", "Black Tern"]) {
    t.insert({ species: s, image: "", audio: "" });
  }
  return t;
};

test("prefixo: devolve só quem começa com o texto, em ordem alfabética", () => {
  assert.deepEqual(names(sample().searchPrefix("am")), ["Amazon Parrot", "American Crow", "American Goldfinch"]);
  assert.deepEqual(names(sample().searchPrefix("yellow")), ["Yellow throated Vireo", "Yellow Warbler"]);
});

test("prefixo: ignora maiúscula e acento", () => {
  assert.deepEqual(names(sample().searchPrefix("SABIA")), ["Sabiá"]);
  assert.deepEqual(names(sample().searchPrefix("sabiá")), ["Sabiá"]);
});

test("prefixo: sem resultado devolve lista vazia; prefixo vazio devolve todas", () => {
  assert.deepEqual(sample().searchPrefix("zz"), []);
  assert.deepEqual(names(sample().searchPrefix("")), ["Amazon Parrot", "American Crow", "American Goldfinch", "Black Tern", "Sabiá", "Yellow throated Vireo", "Yellow Warbler"]);
  assert.deepEqual(new SplayTree().searchPrefix("a"), []);
});

test("prefixo: não reorganiza a árvore nem conta como acesso", () => {
  const t = sample();
  const root = t.rootSpecies;
  const before = t.getAccessCount("American Crow");
  t.searchPrefix("am");
  assert.equal(t.rootSpecies, root);
  assert.equal(t.getAccessCount("American Crow"), before);
});

test("prefixo: confere com busca por força bruta em dados aleatórios", () => {
  const t = new SplayTree();
  let seed = 7;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const all = [];
  for (let i = 0; i < 600; i++) {
    const s = Array.from({ length: 2 + Math.floor(rnd() * 5) }, () => "abcde"[Math.floor(rnd() * 5)]).join("");
    all.push(s);
    t.insert({ species: s, image: "", audio: "" });
  }
  const unique = [...new Set(all)].sort();
  for (const prefix of ["a", "ab", "abc", "e", "ed", "ba", "x", "dd"]) {
    assert.deepEqual(names(t.searchPrefix(prefix)), unique.filter((s) => s.startsWith(prefix)), `prefixo ${prefix}`);
  }
});

test("prefixo: árvore bem desbalanceada (inserção em ordem) não estoura a pilha", () => {
  const t = new SplayTree();
  for (let i = 0; i < 20000; i++) t.insert({ species: `n${String(i).padStart(6, "0")}`, image: "", audio: "" });
  assert.equal(t.searchPrefix("n0000").length, 100);
  assert.equal(t.searchPrefix("n").length, 20000);
});

/* ---- remoção ---- */
const keys = (tree) => [...tree.inOrder()].map((b) => b.species);
const build = (list) => {
  const t = new SplayTree();
  for (const s of list) t.insert({ species: s, image: "", audio: "" });
  return t;
};

test("remoção: devolve a ave removida e ela some da árvore", () => {
  const t = build(["a", "b", "c", "d", "e"]);
  assert.equal(t.remove("c").species, "c");
  assert.equal(t.size, 4);
  assert.deepEqual(keys(t), ["a", "b", "d", "e"]);
  assert.equal(t.peek("c"), undefined);
  assert.equal(t.search("c"), undefined);
  assert.equal(t.depth("c"), -1);
  assert.equal(t.getAccessCount("c"), 0);
  assert.deepEqual(t.searchPrefix("c"), []);
});

test("remoção: espécie ausente devolve undefined e não toca em nada", () => {
  const t = build(["a", "b", "c", "d", "e"]);
  t.search("c"); t.search("c"); t.search("a");
  const root = t.rootSpecies;
  const counts = keys(t).map((k) => t.getAccessCount(k));
  const depths = keys(t).map((k) => t.depth(k));
  assert.equal(t.remove("zzz"), undefined);
  assert.equal(new SplayTree().remove("a"), undefined);
  assert.equal(t.rootSpecies, root);
  assert.deepEqual(keys(t).map((k) => t.getAccessCount(k)), counts);
  assert.deepEqual(keys(t).map((k) => t.depth(k)), depths, "a forma da árvore não muda");
  assert.equal(t.size, 5);
});

test("remoção: tirar um nó que não é a raiz preserva a raiz e os contadores dos outros", () => {
  const t = build(["a", "b", "c", "d", "e"]);
  t.search("e"); t.search("e");          // e vira raiz com contador 3
  t.search("a");                          // a fica abaixo da raiz (contador 2 < 3)
  const counts = { b: t.getAccessCount("b"), c: t.getAccessCount("c"), d: t.getAccessCount("d"), e: t.getAccessCount("e") };
  assert.equal(t.rootSpecies, "e");
  t.remove("a");
  assert.equal(t.rootSpecies, "e", "a raiz continua a ave mais acessada");
  assert.deepEqual(keys(t), ["b", "c", "d", "e"]);
  t.remove("c");                                          // um nó do meio da árvore
  assert.equal(t.rootSpecies, "e", "continua a raiz depois de tirar um nó do meio");
  assert.deepEqual(keys(t), ["b", "d", "e"]);
  for (const k of ["b", "d", "e"]) assert.equal(t.getAccessCount(k), counts[k], `contador de ${k}`);
});

test("remoção: tirar a raiz promove a antecessora", () => {
  const t = build(["a", "b", "c", "d", "e"]);
  t.search("c"); t.search("c");           // c vira raiz
  assert.equal(t.rootSpecies, "c");
  t.remove("c");
  assert.equal(t.rootSpecies, "b", "a maior chave da esquerda sobe");
  assert.deepEqual(keys(t), ["a", "b", "d", "e"]);
});

test("remoção: tirar a raiz sem filhos à esquerda promove a raiz da subárvore direita", () => {
  const t = build(["e", "d", "c", "b", "a"]);   // inserção decrescente: a fica na raiz, sem esquerda
  assert.equal(t.rootSpecies, "a");
  t.remove("a");
  assert.equal(t.rootSpecies, "b");
  assert.deepEqual(keys(t), ["b", "c", "d", "e"]);
});

test("remoção: tirar o único nó esvazia a árvore, e dá para inserir de novo", () => {
  const t = build(["a"]);
  assert.equal(t.remove("a").species, "a");
  assert.equal(t.size, 0);
  assert.equal(t.rootSpecies, null);
  assert.equal(t.height(), 0);
  t.insert({ species: "a", image: "", audio: "" });
  assert.equal(t.size, 1);
  assert.equal(t.getAccessCount("a"), 1, "contador volta a 1");
});

test("remoção: chaves equivalentes (maiúscula, acento) removem o mesmo nó", () => {
  const t = build(["Sabiá", "Tucano"]);
  assert.equal(t.remove("SABIA").species, "Sabiá");
  assert.deepEqual(keys(t), ["Tucano"]);
});

test("remoção: tirar todas, em qualquer ordem, deixa a árvore vazia e ordenada no caminho", () => {
  const list = Array.from({ length: 50 }, (_, i) => `k${String(i).padStart(3, "0")}`);
  for (const order of [list, [...list].reverse(), [...list].sort((a, b) => (a.charCodeAt(2) % 7) - (b.charCodeAt(2) % 7) || a.localeCompare(b))]) {
    const t = build(list);
    let left = [...list];
    for (const s of order) {
      assert.equal(t.remove(s).species, s);
      left = left.filter((x) => x !== s);
      assert.deepEqual(keys(t), left);
    }
    assert.equal(t.size, 0);
  }
});

test("remoção: depois dela a modificação de frequência continua valendo", () => {
  const t = build(Array.from({ length: 40 }, (_, i) => `k${String(i).padStart(2, "0")}`));
  for (let i = 0; i < 6; i++) t.search("k10");
  t.remove("k20"); t.remove("k10"); t.remove("k05");
  for (const k of ["k30", "k31", "k11", "k39", "k00"]) {
    t.search(k);
    assert.ok(t.depth(k) === 0 || t.depth(k) === 1, `${k} no nível ${t.depth(k)}`);
  }
});
