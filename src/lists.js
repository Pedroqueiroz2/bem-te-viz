/** Nó de lista simplesmente encadeada. */
class ListNode {
  /** @param {string} value */
  constructor(value) {
    this.value = value;
    /** @type {ListNode | null} */
    this.next = null;
  }
}

/** Nó da lista de frequência: guarda o valor e o contador dele. */
class CountNode {
  /**
   * @param {string} value
   * @param {number} count
   */
  constructor(value, count) {
    this.value = value;
    this.count = count;
    /** @type {CountNode | null} */
    this.next = null;
  }
}

/**
 * [TAG: ALGORITMO_RANKING_FREQUENCIA]
 * Lista encadeada ordenada pelo contador de acessos, usada no ranking
 * "mais pesquisadas". O primeiro nó tem sempre o maior contador, o segundo o
 * segundo maior, e assim por diante. A cada acesso o nó recebe o contador novo
 * e é reposicionado: sobe até ficar atrás só de quem tem contador maior ou
 * igual (em empate, quem chegou ao valor primeiro fica na frente).
 */
export class FrequencyList {
  /** @type {CountNode | null} */
  #head = null;
  #size = 0;

  get size() {
    return this.#size;
  }

  /**
   * Registra o acesso de `value` com o contador dele já atualizado.
   * Valor novo entra e é posicionado pelo contador; valor existente é
   * removido e reinserido na posição certa.
   */
  access(value, count) {
    let node = null;
    let prev = null;
    for (let cur = this.#head; cur !== null; prev = cur, cur = cur.next) {
      if (cur.value === value) {
        node = cur;
        break;
      }
    }
    if (node === null) {
      node = new CountNode(value, count);
      this.#size++;
    } else {
      if (prev === null) this.#head = node.next;
      else prev.next = node.next;
      node.count = count;
    }
    // acha o último nó com contador >= ao novo; o nó entra logo depois dele
    let before = null;
    for (let cur = this.#head; cur !== null && cur.count >= count; cur = cur.next) before = cur;
    if (before === null) {
      node.next = this.#head;
      this.#head = node;
    } else {
      node.next = before.next;
      before.next = node;
    }
  }

  /** Primeiros `n` valores, do maior para o menor contador. */
  take(n) {
    const out = [];
    for (let node = this.#head; node !== null && out.length < n; node = node.next) out.push(node.value);
    return out;
  }

  toArray() {
    return this.take(this.#size);
  }
}

/**
 * [TAG: ALGORITMO_HISTORICO_RECENTES]
 * Lista encadeada com limite de tamanho, usada no histórico "vistas
 * recentemente". Heurística Move-To-Front (LRU): o valor visto vai para a frente (sem repetir) e, se a
 * lista passar do limite, o último sai.
 */
export class RecentList {
  /** @type {ListNode | null} */
  #head = null;
  #size = 0;
  #limit;

  /** @param {number} limit */
  constructor(limit) {
    this.#limit = limit;
  }

  get size() {
    return this.#size;
  }

  add(value) {
    this.#remove(value);
    const node = new ListNode(value);
    node.next = this.#head;
    this.#head = node;
    this.#size++;
    if (this.#size > this.#limit) this.#dropLast();
  }

  clear() {
    this.#head = null;
    this.#size = 0;
  }

  /** Do mais recente para o mais antigo. */
  toArray() {
    const out = [];
    for (let node = this.#head; node !== null; node = node.next) out.push(node.value);
    return out;
  }

  #remove(value) {
    let prev = null;
    for (let cur = this.#head; cur !== null; prev = cur, cur = cur.next) {
      if (cur.value !== value) continue;
      if (prev === null) this.#head = cur.next;
      else prev.next = cur.next;
      this.#size--;
      return;
    }
  }

  #dropLast() {
    if (this.#head === null) return;
    if (this.#head.next === null) {
      this.#head = null;
    } else {
      let cur = this.#head;
      while (cur.next.next !== null) cur = cur.next;
      cur.next = null;
    }
    this.#size--;
  }
}

/** Nó de lista duplamente encadeada. */
class DoubleNode {
  /** @param {string} value */
  constructor(value) {
    this.value = value;
    /** @type {DoubleNode | null} */
    this.prev = null;
    /** @type {DoubleNode | null} */
    this.next = null;
  }
}

/**
 * [TAG: ESTRUTURA_LINEAR_DUPLAMENTE_ENCADEADA]
 * Lista duplamente encadeada, usada para navegar entre as aves em ordem
 * alfabética ("ave anterior" / "próxima ave") em tempo O(1). O primeiro nó não tem
 * anterior e o último não tem próximo.
 */
export class DoublyLinkedList {
  /** @type {DoubleNode | null} */
  #head = null;
  /** @type {DoubleNode | null} */
  #tail = null;
  #size = 0;

  get size() {
    return this.#size;
  }

  append(value) {
    const node = new DoubleNode(value);
    if (this.#tail === null) {
      this.#head = this.#tail = node;
    } else {
      node.prev = this.#tail;
      this.#tail.next = node;
      this.#tail = node;
    }
    this.#size++;
  }

  /** Nó com o valor (com `prev` e `next`), ou null se não existir. */
  find(value) {
    for (let node = this.#head; node !== null; node = node.next) if (node.value === value) return node;
    return null;
  }

  toArray() {
    const out = [];
    for (let node = this.#head; node !== null; node = node.next) out.push(node.value);
    return out;
  }
}
