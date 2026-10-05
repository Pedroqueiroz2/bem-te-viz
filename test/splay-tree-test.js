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
