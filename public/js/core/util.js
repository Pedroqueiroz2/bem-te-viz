export const $ = (id) => document.getElementById(id);

/** Minúsculas e sem acento, para a busca achar "sabia" em "Sabiá". */
export const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** 83 -> "1:23" */
export const fmt = (t) => {
  t = Number.isFinite(t) ? Math.max(0, Math.round(t)) : 0;
  return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0");
};

/** Gerador pseudoaleatório previsível (mesma semente, mesmo resultado). */
export const rng = (seed) => {
  let h = 2166136261;
  for (const c of seed) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 1000) / 1000; };
};

/** localStorage sem quebrar quando o navegador bloqueia. */
export const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sem armazenamento */ } },
};

export const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
export const fotos = (n) => plural(n, "foto", "fotos");

export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/** Ícone usado nos espaços reservados de imagem. */
export const BIRD_ICON = '<svg width="38" height="38" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><ellipse cx="10.5" cy="14.5" rx="7" ry="4.8" transform="rotate(-12 10.5 14.5)"/><circle cx="17" cy="9" r="3.4"/><path d="M19.8 8.2L23.5 9.6 19.8 11z"/><path d="M2 14.5l-1.5 3 4-1.5z"/></svg>';

/** Bloco mostrado no lugar de uma foto que a amostra não traz. */
export const placeholder = (text = "Sem foto nesta amostra") => `<div class="ph">${BIRD_ICON}<span>${esc(text)}</span></div>`;
