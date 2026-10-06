import { test } from "node:test";
import assert from "node:assert/strict";
import { TranspositionList, RecentList } from "../src/lists.js";

test("transposição: valor novo entra no fim", () => {
  const l = new TranspositionList();
  for (const v of ["a", "b", "c"]) l.access(v);
  assert.deepEqual(l.toArray(), ["a", "b", "c"]);
  assert.equal(l.size, 3);
});

test("transposição: cada acesso sobe uma posição", () => {
  const l = new TranspositionList();
  for (const v of ["a", "b", "c"]) l.access(v);
  l.access("c");
  assert.deepEqual(l.toArray(), ["a", "c", "b"]);
  l.access("c");
  assert.deepEqual(l.toArray(), ["c", "a", "b"]);
  l.access("c");
  assert.deepEqual(l.toArray(), ["c", "a", "b"]);
});

test("transposição: take devolve os primeiros n", () => {
  const l = new TranspositionList();
  for (const v of ["a", "b", "c", "d"]) l.access(v);
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
