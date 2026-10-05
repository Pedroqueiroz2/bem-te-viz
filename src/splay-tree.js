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
    /** @type {number} Frequência de acessos desta espécie */
    this.accessCount = 1;
  }
}

/**
 * Árvore Afunilada (Splay Tree) de pássaros, chaveada pelo nome da espécie.
 * Implementação top-down adaptada para o contexto da aplicação (Frequency-Guarded Splay):
 * - Nós registram sua frequência de acesso (`accessCount`).
 * - Espécies mais frequentes (populares) recebem prioridade máxima, ocupando a raiz ou subníveis superiores.
 * - Buscas por espécies com frequência inferior à da raiz sofrem splay dentro da subárvore (profundidade 1),
 *   otimizando acessos futuros sem desalojar a ave mais frequente (evita poluição da raiz por acessos esporádicos).
 * - Quando a frequência acumulada da ave alcança ou supera a raiz atual, a ave é promovida à raiz global.
 */
export class SplayTree {
  /** @type {SplayNode | null} */
  #root = null;
  #count = 0;

  get size() {
    return this.#count;
  }

  /** Espécie na raiz: a de maior prioridade / mais acessada. */
  get rootSpecies() {
    return this.#root?.value.species ?? null;
  }

  /** Frequência de acesso da espécie na raiz. */
  get rootAccessCount() {
    return this.#root?.accessCount ?? 0;
  }

  /**
   * Insere (ou atualiza) um pássaro.
   * Se a raiz atual tiver prioridade consolidada (accessCount > 1), o novo nó é inserido
   * na subárvore correspondente preservando a raiz prioritária.
   */
  insert(bird) {
    const key = birdKey(bird.species);
    if (this.#root === null) {
      this.#root = new SplayNode(key, bird);
      this.#count++;
      return;
    }

    if (key === this.#root.key) {
      this.#root.value = bird;
      return;
    }

    // Se a raiz atual não possui prioridade consolidada (count <= 1), realiza inserção clássica splay
    if (this.#root.accessCount <= 1) {
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
      return;
    }

    // Raiz com prioridade consolidada: insere na subárvore correspondente mantendo a raiz protegida
    if (key < this.#root.key) {
      if (this.#root.left === null) {
        this.#root.left = new SplayNode(key, bird);
        this.#count++;
        return;
      }
      this.#root.left = this.#splay(this.#root.left, key);
      if (key === this.#root.left.key) {
        this.#root.left.value = bird;
        return;
      }
      const node = new SplayNode(key, bird);
      if (key < this.#root.left.key) {
        node.right = this.#root.left;
        node.left = this.#root.left.left;
        this.#root.left.left = null;
      } else {
        node.left = this.#root.left;
        node.right = this.#root.left.right;
        this.#root.left.right = null;
      }
      this.#root.left = node;
      this.#count++;
    } else {
      if (this.#root.right === null) {
        this.#root.right = new SplayNode(key, bird);
        this.#count++;
        return;
      }
      this.#root.right = this.#splay(this.#root.right, key);
      if (key === this.#root.right.key) {
        this.#root.right.value = bird;
        return;
      }
      const node = new SplayNode(key, bird);
      if (key < this.#root.right.key) {
        node.right = this.#root.right;
        node.left = this.#root.right.left;
        this.#root.right.left = null;
      } else {
        node.left = this.#root.right;
        node.right = this.#root.right.right;
        this.#root.right.right = null;
      }
      this.#root.right = node;
      this.#count++;
    }
  }

  /**
   * Busca por espécie com afunilamento guiado por frequência de acesso.
   * - Incrementa a contagem de acesso da ave encontrada.
   * - Se o nó alcançou ou superou a frequência da raiz atual, é promovido à raiz global (rotação zig).
   * - Caso contrário, o nó sofre splay até o topo da sua subárvore (profundidade 1),
   *   otimizando acessos futuros sem desalojar a ave mais frequente do catálogo.
   */
  search(species) {
    if (this.#root === null) return undefined;
    const key = birdKey(species);

    // Caso 1: Acesso direto à raiz (O(1))
    if (this.#root.key === key) {
      this.#root.accessCount++;
      return this.#root.value;
    }

    // Caso 2: Acesso na subárvore esquerda
    if (key < this.#root.key) {
      if (this.#root.left === null) return undefined;
      this.#root.left = this.#splay(this.#root.left, key);
      if (this.#root.left.key !== key) return undefined;

      this.#root.left.accessCount++;

      // Promove à raiz se a frequência acumulada igualar ou superar a raiz atual
      if (this.#root.left.accessCount >= this.#root.accessCount) {
        const target = this.#root.left;
        this.#root.left = target.right;
        target.right = this.#root;
        this.#root = target;
        return target.value;
      }

      // Raiz prioritária preservada; alvo repousa na profundidade 1
      return this.#root.left.value;
    }

    // Caso 3: Acesso na subárvore direita
    if (this.#root.right === null) return undefined;
    this.#root.right = this.#splay(this.#root.right, key);
    if (this.#root.right.key !== key) return undefined;

    this.#root.right.accessCount++;

    // Promove à raiz se a frequência acumulada igualar ou superar a raiz atual
    if (this.#root.right.accessCount >= this.#root.accessCount) {
      const target = this.#root.right;
      this.#root.right = target.left;
      target.left = this.#root;
      this.#root = target;
      return target.value;
    }

    // Raiz prioritária preservada; alvo repousa na profundidade 1
    return this.#root.right.value;
  }

  /**
   * Retorna a contagem de acessos de uma espécie (0 se inexistente).
   * Consulta sem reorganizar a árvore (peeking).
   */
  getAccessCount(species) {
    const key = birdKey(species);
    let node = this.#root;
    while (node !== null) {
      if (key === node.key) return node.accessCount;
      node = key < node.key ? node.left : node.right;
    }
    return 0;
  }

  /**
   * Retorna a profundidade de uma espécie na árvore (0 = raiz, 1 = filho direto, -1 se não encontrada).
   */
  depth(species) {
    const key = birdKey(species);
    let d = 0;
    let node = this.#root;
    while (node !== null) {
      if (key === node.key) return d;
      node = key < node.key ? node.left : node.right;
      d++;
    }
    return -1;
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
