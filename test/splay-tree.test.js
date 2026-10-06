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
