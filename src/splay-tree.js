import { birdKey } from "./bird.js";

/** @typedef {import("./bird.js").Bird} Bird */

class SplayNode {
  /**
   * @param {string} key
   * @param {Bird} value
   */
  constructor(key, value) {
    this.key = key;
    this.value = value;
    /** @type {SplayNode | null} */
    this.left = null;
    /** @type {SplayNode | null} */
    this.right = null;
  }
}

/**
 * Árvore Afunilada (Splay Tree) de pássaros, chaveada pelo nome da espécie.
 * Implementação clássica top-down (Sleator & Tarjan): todo acesso
 * (inserção ou busca) traz o nó acessado para a raiz.
 */
export class SplayTree {
  /** @type {SplayNode | null} */
  #root = null;
  #count = 0;

  get size() {
    return this.#count;
  }

  /** Espécie na raiz: a acessada mais recentemente. */
  get rootSpecies() {
    return this.#root?.value.species ?? null;
  }

  /** Insere (ou atualiza) um pássaro; o nó inserido vira a raiz. */
  insert(bird) {
    const key = birdKey(bird.species);
    if (this.#root === null) {
      this.#root = new SplayNode(key, bird);
      this.#count++;
      return;
    }
    this.#root = this.#splay(this.#root, key);
    if (key === this.#root.key) {
      this.#root.value = bird;
      return;
    }
    const node = new SplayNode(key, bird);
    if (key < this.#root.key) {
      node.right = this.#root;
      node.left = this.#root.left;
      this.#root.left = null;
    } else {
      node.left = this.#root;
      node.right = this.#root.right;
      this.#root.right = null;
    }
    this.#root = node;
    this.#count++;
  }

  /** Busca por espécie; se encontrar, o nó sobe para a raiz. */
  search(species) {
    if (this.#root === null) return undefined;
    const key = birdKey(species);
    this.#root = this.#splay(this.#root, key);
    return this.#root.key === key ? this.#root.value : undefined;
  }

  /** Busca sem reorganizar a árvore. */
  peek(species) {
    const key = birdKey(species);
    let node = this.#root;
    while (node !== null) {
      if (key === node.key) return node.value;
      node = key < node.key ? node.left : node.right;
    }
    return undefined;
  }

  /** Percurso em ordem: pássaros ordenados por espécie. */
  *inOrder() {
    /** @type {SplayNode[]} */
    const stack = [];
    let node = this.#root;
    while (node !== null || stack.length > 0) {
      while (node !== null) {
        stack.push(node);
        node = node.left;
      }
      node = stack.pop();
      yield node.value;
      node = node.right;
    }
  }

  /** Altura da árvore (0 se vazia). */
  height() {
    const h = (n) =>
      n === null ? 0 : 1 + Math.max(h(n.left), h(n.right));
    return h(this.#root);
  }

  /** Splay top-down: traz para a raiz o nó com `key` (ou o último visitado). */
  #splay(root, key) {
    const header = new SplayNode("", /** @type {Bird} */ (null));
    let leftMax = header;
    let rightMin = header;
    let t = root;

    for (;;) {
      if (key < t.key) {
        if (t.left === null) break;
        if (key < t.left.key) {
          // zig-zig: rotação à direita
          const y = t.left;
          t.left = y.right;
          y.right = t;
          t = y;
          if (t.left === null) break;
        }
        rightMin.left = t;
        rightMin = t;
        t = t.left;
      } else if (key > t.key) {
        if (t.right === null) break;
        if (key > t.right.key) {
          // zig-zig: rotação à esquerda
          const y = t.right;
          t.right = y.left;
          y.left = t;
          t = y;
          if (t.right === null) break;
        }
        leftMax.right = t;
        leftMax = t;
        t = t.right;
      } else {
        break;
      }
    }

    leftMax.right = t.left;
    rightMin.left = t.right;
    t.left = header.right;
    t.right = header.left;
    return t;
  }
}
