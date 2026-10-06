import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { makeFixture, startServer, launchBrowser, findChrome } from "./helpers.js";

/*
 * Testes da interface em um Chrome de verdade (desktop, 1280x900), com um
 * catálogo pequeno e controlado. Rodam com `npm run test:e2e`; sem o Chrome
 * instalado (ou com CHROME_PATH apontando para ele), os testes são pulados.
 */

let fixture, server, page;
const names = "[...document.querySelectorAll('#all .name')].map(n => n.textContent)";
const url = (p) => `${server.base}/${p}`;
const SPECIES = (name) => `especies.html#/especie/${encodeURIComponent(name)}`;

before(async () => {
  page = await launchBrowser();
  if (!page) return;
  fixture = makeFixture();
  server = await startServer({ catalogDir: fixture });
});

after(async () => {
  await page?.close();
  await server?.stop();
  if (fixture) fs.rmSync(fixture, { recursive: true, force: true });
});

const skip = () => (findChrome() ? false : "Chrome não encontrado (defina CHROME_PATH)");

describe("lista de espécies e busca", { skip: skip() }, () => {
  test("carrega o catálogo em ordem alfabética, sem erros no console", async () => {
    await page.go(url("especies.html"));
    await page.until("document.querySelectorAll('#all .mini').length === 7", "7 cartões");
    assert.deepEqual(await page.ev(names), ["Alpha Bird", "Alphabet Wren", "Beta Bird", "Delta <b>Bold</b> Bird", "Épsilon Café", "Gamma Bird", "Zeta Bird"]);
    assert.match(await page.ev("document.getElementById('count').innerText"), /7\s+espécies/);
    assert.deepEqual(page.errors, []);
  });

  test("busca: quem começa com o texto vem antes de quem só contém", async () => {
    await page.type("#q", "alp");
    assert.deepEqual(await page.ev(names), ["Alpha Bird", "Alphabet Wren"]);
    await page.type("#q", "a");
    const found = await page.ev(names);
    assert.deepEqual(found.slice(0, 2), ["Alpha Bird", "Alphabet Wren"]);   // prefixo primeiro
    assert.ok(found.includes("Gamma Bird"));                                 // depois os que contêm "a"
    assert.equal(new Set(found).size, found.length, "sem repetidos");
  });

  test("busca ignora acento e maiúscula", async () => {
    await page.type("#q", "EPSILON cafe");
    assert.deepEqual(await page.ev(names), ["Épsilon Café"]);
  });

  test("busca sem resultado mostra a mensagem e some com a grade", async () => {
    await page.type("#q", "xyzzy");
    assert.equal(await page.ev("document.getElementById('empty').hidden"), false);
    assert.equal(await page.ev("document.getElementById('all').hidden"), true);
    await page.type("#q", "");
    assert.equal((await page.ev(names)).length, 7);
  });

  test("digitar na busca não conta como acesso", async () => {
    await page.type("#q", "alpha");
    const counters = await page.ev("[...document.querySelectorAll('#all .cnt')].map(c => c.textContent)");
    assert.ok(counters.every((c) => c === "1"), `contadores: ${counters}`);
    await page.type("#q", "");
  });

  test("nome com HTML é mostrado como texto, sem virar elemento", async () => {
    await page.go(url("especies.html"));
    await page.until("document.querySelectorAll('#all .mini').length === 7");
    assert.equal(await page.ev("document.querySelectorAll('#all .name b').length"), 0);
    assert.ok((await page.ev(names)).includes("Delta <b>Bold</b> Bird"));
    await page.hash("#/especie/" + encodeURIComponent("Delta <b>Bold</b> Bird"));
    assert.equal(await page.ev("document.getElementById('spName').textContent"), "Delta <b>Bold</b> Bird");
    assert.equal(await page.ev("document.querySelectorAll('#spName b').length"), 0);
  });
});

describe("página da espécie", { skip: skip() }, () => {
  test("mostra fotos, áudios, miniaturas e a lista de gravações", async () => {
    await page.go(url(SPECIES("Alpha Bird")));
    await page.until("document.getElementById('spName').textContent === 'Alpha Bird'");
    assert.match(await page.ev("document.getElementById('spSub').textContent"), /3 fotos · 2 áudios/);
    assert.equal(await page.ev("document.querySelectorAll('#spStrip .thumb').length"), 3);
    assert.equal(await page.ev("document.querySelectorAll('#spTracks .track').length"), 2);
    assert.equal(await page.ev("document.getElementById('bigplay').disabled"), false);
  });

  test("ave sem foto e sem áudio mostra aviso e desabilita o play", async () => {
    await page.go(url(SPECIES("Gamma Bird")));
    await page.until("document.getElementById('spName').textContent === 'Gamma Bird'");
    assert.equal(await page.ev("document.getElementById('bigplay').disabled"), true);
    assert.equal(await page.ev("document.getElementById('spNote').hidden"), false);
    assert.equal(await page.ev("document.getElementById('secPhotos').hidden"), true);
    assert.equal(await page.ev("getComputedStyle(document.getElementById('spGallery')).display"), "none");
    assert.match(await page.ev("document.getElementById('spPhoto').innerText"), /Sem foto/);
  });

  test("ave anterior e próxima: a primeira não tem anterior, a última não tem próxima", async () => {
    const pager = () => page.ev("({ prev: getComputedStyle(document.getElementById('prevBird')).visibility, next: getComputedStyle(document.getElementById('nextBird')).visibility, prevName: document.querySelector('#prevBird b').textContent, nextName: document.querySelector('#nextBird b').textContent })");
    await page.go(url(SPECIES("Alpha Bird")));
    await page.until("document.getElementById('spName').textContent === 'Alpha Bird'");
    let p = await pager();
    assert.equal(p.prev, "hidden");
    assert.equal(p.next, "visible");
    assert.equal(p.nextName, "Alphabet Wren");

    await page.go(url(SPECIES("Zeta Bird")));
    await page.until("document.getElementById('spName').textContent === 'Zeta Bird'");
    p = await pager();
    assert.equal(p.next, "hidden");
    assert.equal(p.prev, "visible");
    assert.equal(p.prevName, "Gamma Bird");
  });

  test("clicar em próxima e anterior navega na ordem alfabética", async () => {
    await page.go(url(SPECIES("Beta Bird")));
    await page.until("document.getElementById('spName').textContent === 'Beta Bird'");
    await page.ev("document.getElementById('nextBird').click()");
    await page.until("document.getElementById('spName').textContent.startsWith('Delta')");
    await page.ev("document.getElementById('prevBird').click()");
    await page.until("document.getElementById('spName').textContent === 'Beta Bird'");
  });

  test("endereço de ave inexistente volta para a lista sem quebrar", async () => {
    await page.go(url("especies.html#/especie/Nao%20Existe"));
    await page.until("!document.getElementById('viewList').hidden", "voltar à lista");
    assert.equal(await page.ev("document.getElementById('viewSpecies').hidden"), true);
    assert.equal((await page.ev(names)).length, 7);
  });

  test("carrossel: abre na foto, avança, usa o teclado e fecha", async () => {
    await page.go(url(SPECIES("Alpha Bird")));
    await page.until("document.getElementById('spName').textContent === 'Alpha Bird'");
    await page.ev("document.querySelector('.photo-open').click()");
    await page.until("document.getElementById('lightbox').open", "abrir carrossel");
    assert.equal(await page.ev("document.getElementById('counter').textContent"), "1 / 3");
    assert.equal(await page.ev("document.getElementById('prev').disabled"), true);
    await page.ev("document.getElementById('next').click()");
    assert.equal(await page.ev("document.getElementById('counter').textContent"), "2 / 3");
    await page.ev("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))");
    assert.equal(await page.ev("document.getElementById('counter').textContent"), "3 / 3");
    assert.equal(await page.ev("document.getElementById('next').disabled"), true);
    await page.ev("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))");
    assert.equal(await page.ev("document.getElementById('counter').textContent"), "2 / 3");
    await page.ev("document.getElementById('lbClose').click()");
    assert.equal(await page.ev("document.getElementById('lightbox').open"), false);
  });

  test("miniatura da página abre o carrossel naquela foto", async () => {
    await page.ev("document.querySelectorAll('#spStrip .thumb')[2].click()");
    await page.until("document.getElementById('lightbox').open");
    assert.equal(await page.ev("document.getElementById('counter').textContent"), "3 / 3");
    await page.ev("document.getElementById('lbClose').click()");
  });

  test("escolher outra gravação seleciona a faixa", async () => {
    await page.ev("document.querySelectorAll('#spTracks .track')[1].click()");
    assert.equal(await page.ev("document.querySelectorAll('#spTracks .track')[1].getAttribute('aria-current')"), "true");
    assert.equal(await page.ev("document.querySelectorAll('#spTracks .track')[0].getAttribute('aria-current')"), "false");
  });
});

describe("galerias", { skip: skip() }, () => {
  test("mostra todas as fotos da ave em grade, sem carrossel", async () => {
    await page.go(url("galerias.html#/galeria/" + encodeURIComponent("Alpha Bird")));
    await page.until("document.querySelectorAll('#photoGrid li').length === 3", "3 fotos na grade");
    assert.equal(await page.ev("document.getElementById('carousel')"), null);
  });

  test("ave sem fotos mostra a mensagem de vazio", async () => {
    await page.go(url("galerias.html#/galeria/" + encodeURIComponent("Gamma Bird")));
    await page.until("document.getElementById('gName').textContent === 'Gamma Bird'");
    assert.equal(await page.ev("document.getElementById('gEmpty').hidden"), false);
    assert.equal(await page.ev("document.querySelectorAll('#photoGrid li').length"), 0);
  });
});

describe("contador, ranking e histórico", { skip: skip() }, () => {
  test("estado começa zerado e cresce com o uso (sequência controlada)", async () => {
    // zera a sessão deste teste: limpa o armazenamento e recarrega
    await page.go(url("index.html"));
    await page.ev("localStorage.clear()");
    await page.reload();
    await page.until("document.querySelectorAll('#destaque .mini').length > 0");
    assert.equal(await page.ev("document.querySelectorAll('#destaque .rank').length"), 0, "sem ranking antes de abrir aves");
    assert.match(await page.ev("document.getElementById('destaqueTxt').textContent"), /Enquanto você não abre nenhuma/);

    // Alpha x2, Beta x1, Gamma x1 (nomes alternados: o hash muda a cada passo)
    for (const n of ["Alpha Bird", "Beta Bird", "Alpha Bird", "Gamma Bird"]) {
      await page.go(url(SPECIES(n)));
      await page.until(`document.getElementById('spName').textContent === ${JSON.stringify(n)}`);
    }

    await page.go(url("index.html"));
    await page.until("document.querySelectorAll('#destaque .rank').length === 3", "3 aves no ranking");
    assert.deepEqual(await page.ev("[...document.querySelectorAll('#destaque .name')].map(n => n.textContent)"), ["Alpha Bird", "Beta Bird", "Gamma Bird"]);
    const counters = await page.ev("[...document.querySelectorAll('#destaque .cnt')].map(c => +c.textContent)");
    assert.deepEqual(counters, [3, 2, 2], "o primeiro tem o maior contador");
    assert.doesNotMatch(await page.ev("document.getElementById('destaqueTxt').textContent"), /Enquanto você não abre nenhuma/);
  });

  test("histórico: mais recente primeiro, sem repetir", async () => {
    await page.go(url("especies.html"));
    await page.until("document.querySelectorAll('#recentList .mini').length === 3");
    assert.deepEqual(await page.ev("[...document.querySelectorAll('#recentList .name')].map(n => n.textContent)"), ["Gamma Bird", "Alpha Bird", "Beta Bird"]);
  });

  test("F5 mantém contador, ranking e histórico", async () => {
    await page.reload();
    await page.until("document.querySelectorAll('#recentList .mini').length === 3");
    assert.deepEqual(await page.ev("[...document.querySelectorAll('#recentList .name')].map(n => n.textContent)"), ["Gamma Bird", "Alpha Bird", "Beta Bird"]);
    const alpha = await page.ev("[...document.querySelectorAll('#all .mini')].find(m => m.querySelector('.name').textContent === 'Alpha Bird').querySelector('.cnt').textContent");
    assert.equal(alpha, "3");
  });

  test("limpar histórico esvazia só o histórico", async () => {
    await page.ev("document.getElementById('clearRecent').click()");
    assert.equal(await page.ev("document.getElementById('secRecent').hidden"), true);
    await page.reload();
    assert.equal(await page.ev("document.getElementById('secRecent').hidden"), true, "continua vazio depois do F5");
    await page.go(url("index.html"));
    await page.until("document.querySelectorAll('#destaque .rank').length === 3", "ranking continua");
  });

  test("reiniciar o servidor zera tudo (sessão nova)", async () => {
    await server.stop();
    server = await startServer({ port: server.port, catalogDir: fixture });
    await page.go(url("index.html"));
    await page.until("document.querySelectorAll('#destaque .mini').length > 0");
    assert.equal(await page.ev("document.querySelectorAll('#destaque .rank').length"), 0, "ranking zerado");
    await page.go(url("especies.html"));
    await page.until("document.querySelectorAll('#all .mini').length === 7");
    assert.equal(await page.ev("document.getElementById('secRecent').hidden"), true, "histórico zerado");
    const counters = await page.ev("[...document.querySelectorAll('#all .cnt')].map(c => c.textContent)");
    assert.ok(counters.every((c) => c === "1"), "contadores voltaram a 1");
  });
});

describe("robustez", { skip: skip() }, () => {
  test("a inicial mostra fotos e gravações do catálogo", async () => {
    await page.go(url("index.html"));
    await page.until("document.querySelectorAll('#players .mp').length > 0", "mini-players");
    assert.ok((await page.ev("document.querySelectorAll('#players .mp').length")) >= 1);
    assert.ok((await page.ev("document.querySelectorAll('#destaque .mini').length")) >= 1);
  });

  test("a página abre mesmo com o armazenamento do navegador bloqueado", async () => {
    await page.addScriptOnNewDocument("Object.defineProperty(window, 'localStorage', { get() { throw new Error('bloqueado'); } });");
    await page.go(url("especies.html"));
    await page.until("document.querySelectorAll('#all .mini').length === 7", "lista com armazenamento bloqueado");
    await page.go(url(SPECIES("Alpha Bird")));
    await page.until("document.getElementById('spName').textContent === 'Alpha Bird'", "página da ave com armazenamento bloqueado");
  });
});
