import { test } from "node:test";
import assert from "node:assert/strict";
import { FrequencyList, RecentList, DoublyLinkedList } from "../src/lists.js";

test("frequência: valor novo entra pelo contador, em empate fica atrás", () => {
  const l = new FrequencyList();
  l.access("a", 2);
  l.access("b", 2);
  l.access("c", 2);
  assert.deepEqual(l.toArray(), ["a", "b", "c"]);
  assert.equal(l.size, 3);
});

test("frequência: o maior contador fica sempre na frente", () => {
  const l = new FrequencyList();
  for (const v of ["a", "b", "c"]) l.access(v, 2);
  l.access("c", 3);
  assert.deepEqual(l.toArray(), ["c", "a", "b"]);
  l.access("b", 3);
  assert.deepEqual(l.toArray(), ["c", "b", "a"]);   // empata com c, fica atrás dele
  l.access("a", 4);
  assert.deepEqual(l.toArray(), ["a", "c", "b"]);   // pula mais de uma posição
});

test("frequência: sempre em ordem decrescente de contador", () => {
  const l = new FrequencyList();
  const counts = new Map();
  const bump = (v) => { counts.set(v, (counts.get(v) ?? 1) + 1); l.access(v, counts.get(v)); };
  for (const v of ["x", "y", "x", "z", "y", "y", "w", "z", "z", "z", "x"]) bump(v);
  const order = l.toArray().map((v) => counts.get(v));
  assert.deepEqual(order, [...order].sort((p, q) => q - p));
  assert.equal(l.size, 4);
});

test("frequência: take devolve os primeiros n", () => {
  const l = new FrequencyList();
  for (const v of ["a", "b", "c", "d"]) l.access(v, 2);
  assert.deepEqual(l.take(2), ["a", "b"]);
  assert.deepEqual(l.take(10), ["a", "b", "c", "d"]);
});

test("recentes: o mais novo vai para a frente, sem repetir", () => {
  const l = new RecentList(3);
  for (const v of ["a", "b", "c"]) l.add(v);
  assert.deepEqual(l.toArray(), ["c", "b", "a"]);
  l.add("a");
  assert.deepEqual(l.toArray(), ["a", "c", "b"]);
  assert.equal(l.size, 3);
});

test("recentes: respeita o limite descartando o mais antigo", () => {
  const l = new RecentList(2);
  for (const v of ["a", "b", "c"]) l.add(v);
  assert.deepEqual(l.toArray(), ["c", "b"]);
  l.clear();
  assert.deepEqual(l.toArray(), []);
  assert.equal(l.size, 0);
});

test("duplamente encadeada: cada nó conhece anterior e próximo", () => {
  const l = new DoublyLinkedList();
  for (const v of ["a", "b", "c"]) l.append(v);
  assert.equal(l.size, 3);
  const b = l.find("b");
  assert.equal(b.prev.value, "a");
  assert.equal(b.next.value, "c");
  assert.deepEqual(l.toArray(), ["a", "b", "c"]);
});

test("duplamente encadeada: o primeiro não tem anterior e o último não tem próximo", () => {
  const l = new DoublyLinkedList();
  for (const v of ["a", "b", "c"]) l.append(v);
  assert.equal(l.find("a").prev, null);
  assert.equal(l.find("c").next, null);
  assert.equal(l.find("z"), null);
  const one = new DoublyLinkedList();
  one.append("x");
  assert.equal(one.find("x").prev, null);
  assert.equal(one.find("x").next, null);
});
