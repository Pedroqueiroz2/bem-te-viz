/** Nó de lista simplesmente encadeada. */
class ListNode {
  /** @param {string} value */
  constructor(value) {
    this.value = value;
    /** @type {ListNode | null} */
    this.next = null;
  }
}

/**
 * Lista encadeada com transposição, usada no ranking "mais pesquisadas".
 * Valor novo entra no fim; a cada acesso o valor troca de lugar com o
 * antecessor, subindo uma posição por vez. Assim os mais acessados
 * tendem a ficar no início sem precisar ordenar nada.
 */
export class TranspositionList {
  /** @type {ListNode | null} */
  #head = null;
  #size = 0;

  get size() {
    return this.#size;
  }

  /** Acrescenta no fim sem transposição (usado para restaurar uma ordem salva). */
  append(value) {
    const node = new ListNode(value);
    this.#size++;
    if (this.#head === null) {
      this.#head = node;
      return;
    }
    let last = this.#head;
    while (last.next !== null) last = last.next;
    last.next = node;
  }

  /** Registra um acesso: insere no fim se for novo, senão sobe uma posição. */
  access(value) {
    let prevPrev = null;
    let prev = null;
    let cur = this.#head;
    while (cur !== null && cur.value !== value) {
      prevPrev = prev;
      prev = cur;
      cur = cur.next;
    }
    if (cur === null) {
      this.append(value);
      return;
    }
    if (prev === null) return;
    prev.next = cur.next;
    cur.next = prev;
    if (prevPrev === null) this.#head = cur;
    else prevPrev.next = cur;
  }

  /** Primeiros `n` valores, do mais para o menos acessado. */
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
 * Lista encadeada com limite de tamanho, usada no histórico "vistas
 * recentemente". O valor visto vai para a frente (sem repetir) e, se a
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
 * Lista duplamente encadeada, usada para navegar entre as aves em ordem
 * alfabética ("ave anterior" / "próxima ave"). O primeiro nó não tem
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
