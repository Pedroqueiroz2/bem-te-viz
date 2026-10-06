const PAGES = [
  ["index.html", "Início", "inicio"],
  ["especies.html", "Espécies", "especies"],
  ["galerias.html", "Galerias", "galerias"],
  ["sobre.html", "Sobre", "sobre"],
];
const active = document.body.dataset.page;
const logo = `<svg viewBox="0 0 44 40" aria-hidden="true">
  <path d="M2 14c0-7 6-12 13-12v26C7 28 2 22 2 14z" fill="#ffc20e"/>
  <path d="M15 2c8 0 14 5 14 13H15V2z" fill="#1550e8"/>
  <path d="M29 15c0 9-6 15-14 15V15h14z" fill="#0f9d58"/>
  <circle cx="33" cy="9" r="7" fill="#14284b"/>
  <path d="M37 7l7 3-7 3z" fill="#e5303a"/>
  <circle cx="34" cy="8" r="1.6" fill="#fff"/></svg>`;
const nav = PAGES.map(([href, label, id]) =>
  `<a href="${href}"${id === active ? ' aria-current="page"' : ""}>${label}</a>`).join("");

const header = document.getElementById("site-header");
if (header) header.outerHTML = `<header class="top"><div class="wrap">
  <a class="brand" href="index.html" aria-label="Bem-te-viz, início">${logo}<span>Bem-te-viz</span></a>
  <nav class="nav" aria-label="Principal">${nav}</nav>
  <div class="top-actions">
    <a class="icon-btn" href="especies.html" aria-label="Buscar espécie">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg></a>
    <a class="cta" href="especies.html">Explorar espécies
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
  </div></div></header>`;

const footer = document.getElementById("site-footer");
if (footer) footer.outerHTML = `<footer class="foot"><span class="blob f1"></span><span class="blob f2"></span>
  <div class="wrap">
    <a class="brand" href="index.html"><span>Bem-te-viz</span></a>
    <nav aria-label="Rodapé">${PAGES.map(([h, l]) => `<a href="${h}">${l}</a>`).join("")}</nav>
    <div class="lema"><span>Ciência</span><span>Natureza</span><span>Brasil</span></div>
  </div></footer>`;
