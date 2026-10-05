import { SplayTree } from "../src/splay-tree.js";

// Catálogo de aves com conteúdo multimídia e metadados CUB-200
const listaAves = [
  {
    id: 1,
    numero: "001",
    species: "Ararajuba",
    nome_popular: "Ararajuba",
    titulo: "Guaruba guarouba",
    familia: "Psittacidae",
    genero: "Guaruba",
    recente: "Destaque",
    imagem: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Red-shouldered_Hawk_2_%28cropped%29.jpg/800px-Red-shouldered_Hawk_2_%28cropped%29.jpg",
    audio: "https://upload.wikimedia.org/wikipedia/commons/b/b5/Bird_chirping_in_a_forest.ogg",
    json_info: {
      Habitat: "Floresta Ombrófila Densa (Amazônia)",
      Dieta: "Sementes, frutos e bagas",
      Status: "Vulnerável (VU)"
    }
  },
  {
    id: 2,
    numero: "002",
    species: "João-de-barro",
    nome_popular: "João-de-barro",
    titulo: "Furnarius rufus",
    familia: "Furnariidae",
    genero: "Furnarius",
    recente: "Popular",
    imagem: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Furnarius_rufus_-_Parque_Nacional_Itatiaia_-_Brazil_01.jpg/800px-Furnarius_rufus_-_Parque_Nacional_Itatiaia_-_Brazil_01.jpg",
    audio: "https://upload.wikimedia.org/wikipedia/commons/3/3b/Furnarius_rufus_call.ogg",
    json_info: {
      Habitat: "Áreas abertas, campos e zonas urbanas",
      Dieta: "Insetos e artrópodes de solo",
      Status: "Pouco Preocupante (LC)"
    }
  },
  {
    id: 3,
    numero: "003",
    species: "Tucano-toco",
    nome_popular: "Tucano-toco",
    titulo: "Ramphastos toco",
    familia: "Ramphastidae",
    genero: "Ramphastos",
    recente: "Popular",
    imagem: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Ramphastos_toco_-Pantanal%2C_Brazil_-8-4c_%28cropped%29.jpg/800px-Ramphastos_toco_-Pantanal%2C_Brazil_-8-4c_%28cropped%29.jpg",
    audio: "https://upload.wikimedia.org/wikipedia/commons/b/b5/Bird_chirping_in_a_forest.ogg",
    json_info: {
      Habitat: "Cerrado, matas de galeria e Pantanal",
      Dieta: "Frutos, ovos e pequenos insetos",
      Status: "Pouco Preocupante (LC)"
    }
  },
  {
    id: 4,
    numero: "004",
    species: "Bem-te-vi",
    nome_popular: "Bem-te-vi",
    titulo: "Pitangus sulphuratus",
    familia: "Tyrannidae",
    genero: "Pitangus",
    recente: "Mais Acessada",
    imagem: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Furnarius_rufus_-_Parque_Nacional_Itatiaia_-_Brazil_01.jpg/800px-Furnarius_rufus_-_Parque_Nacional_Itatiaia_-_Brazil_01.jpg",
    audio: "https://upload.wikimedia.org/wikipedia/commons/b/b5/Bird_chirping_in_a_forest.ogg",
    json_info: {
      Habitat: "Florestas, cidades e margens de rios",
      Dieta: "Insetos, pequenos vertebrados e frutos",
      Status: "Pouco Preocupante (LC)"
    }
  },
  {
    id: 5,
    numero: "005",
    species: "Arara-azul",
    nome_popular: "Arara-azul",
    titulo: "Anodorhynchus hyacinthinus",
    familia: "Psittacidae",
    genero: "Anodorhynchus",
    recente: "Recente",
    imagem: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Red-shouldered_Hawk_2_%28cropped%29.jpg/800px-Red-shouldered_Hawk_2_%28cropped%29.jpg",
    audio: "https://upload.wikimedia.org/wikipedia/commons/3/3b/Furnarius_rufus_call.ogg",
    json_info: {
      Habitat: "Pantanal e Cerrado",
      Dieta: "Castanhas de palmeiras",
      Status: "Vulnerável (VU)"
    }
  },
  {
    id: 6,
    numero: "006",
    species: "Sabiá-laranjeira",
    nome_popular: "Sabiá-laranjeira",
    titulo: "Turdus rufiventris",
    familia: "Turdidae",
    genero: "Turdus",
    recente: "Nacional",
    imagem: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Furnarius_rufus_-_Parque_Nacional_Itatiaia_-_Brazil_01.jpg/800px-Furnarius_rufus_-_Parque_Nacional_Itatiaia_-_Brazil_01.jpg",
    audio: "https://upload.wikimedia.org/wikipedia/commons/b/b5/Bird_chirping_in_a_forest.ogg",
    json_info: {
      Habitat: "Matas, pomares e parques urbanos",
      Dieta: "Frutos e minhocas",
      Status: "Pouco Preocupante (LC)"
    }
  }
];

// Inicialização da Estrutura Hierárquica (Splay Tree)
const tree = new SplayTree();
for (const ave of listaAves) {
  tree.insert(ave);
}

// Atualiza o indicador visual da Splay Tree no cabeçalho/busca
function atualizarStatusArvore(msgExtra = "") {
  const rootDisplay = document.getElementById("tree-root-display");
  if (!rootDisplay) return;
  const raizAtual = tree.rootSpecies ?? "Vazia";
  rootDisplay.innerHTML = `Raiz Atual: <b>${raizAtual}</b> | Espécies cadastradas: <b>${tree.size}</b> ${msgExtra ? `— <i>${msgExtra}</i>` : ""}`;
}

// Renderiza os cards no grid
function renderizarCards(aves) {
  const grid = document.getElementById("grid-aves");
  if (!grid) return;
  grid.innerHTML = "";

  if (aves.length === 0) {
    grid.innerHTML = `<p style="grid-column: 1 / -1; color: #888; font-size: 16px;">Nenhuma ave encontrada na Splay Tree para o termo buscado.</p>`;
    return;
  }

  aves.forEach((ave) => {
    const card = document.createElement("div");
    card.className = "bird-card";
    card.innerHTML = `
      <div style="position: relative; height: 240px; background: #dce2da;">
        <img src="${ave.imagem}" style="width: 100%; height: 100%; object-fit: cover;" alt="${ave.nome_popular}">
        <div style="position: absolute; top: 15px; left: 15px; background: rgba(251,250,246,0.9); padding: 6px 10px; font-size: 8px; font-weight: 700; text-transform: uppercase; border-radius: 2px;">${ave.recente}</div>
        <div style="position: absolute; right: 15px; bottom: 10px; color: white; font-family: 'DM Serif Display'; font-size: 22px; text-shadow: 0 1px 8px rgba(0,0,0,0.7);">${ave.numero}</div>
      </div>
      <div style="padding: 22px;">
        <p class="eyebrow" style="margin-bottom: 6px;">${ave.familia}</p>
        <h3 style="font-size: 24px; margin: 0 0 4px 0;">${ave.nome_popular}</h3>
        <p class="scientific-name">${ave.titulo}</p>
      </div>
    `;

    card.addEventListener("click", () => {
      // Quando clica no card, realiza a busca na árvore afunilada
      const resultado = tree.search(ave.nome_popular);
      atualizarStatusArvore(`Acesso registrado para '${ave.nome_popular}' (Splay executado)`);
      abrirDetalhes(resultado || ave);
    });

    grid.appendChild(card);
  });
}

// Abre a tela de detalhes de uma ave
function abrirDetalhes(ave) {
  document.getElementById("tela-home").style.display = "none";
  document.getElementById("tela-detalhe").style.display = "block";
  window.scrollTo(0, 0);

  document.getElementById("detalhe-numero").innerText = `REGISTRO #${ave.numero}`;
  document.getElementById("detalhe-nome").innerText = ave.nome_popular;
  document.getElementById("detalhe-cientifico").innerText = ave.titulo;
  document.getElementById("detalhe-img").src = ave.imagem;
  document.getElementById("detalhe-audio").src = ave.audio;
  document.getElementById("detalhe-familia-genero").innerHTML = `<b>${ave.familia}</b> (${ave.genero})`;
  document.getElementById("detalhe-habitat").innerText = ave.json_info.Habitat;
  document.getElementById("detalhe-dieta").innerText = ave.json_info.Dieta;
  document.getElementById("detalhe-status").innerText = ave.json_info.Status;
}

// Botão Voltar para o Catálogo
const btnVoltar = document.getElementById("btn-voltar");
if (btnVoltar) {
  btnVoltar.addEventListener("click", () => {
    document.getElementById("tela-detalhe").style.display = "none";
    document.getElementById("tela-home").style.display = "block";
    window.scrollTo(0, 0);
  });
}

// Conexão do Campo de Busca com a Splay Tree
const inputBusca = document.getElementById("input-busca");
if (inputBusca) {
  inputBusca.addEventListener("input", (e) => {
    const termo = e.target.value.trim();

    if (!termo) {
      renderizarCards(listaAves);
      atualizarStatusArvore();
      return;
    }

    // Busca formal na Splay Tree
    const aveEncontrada = tree.search(termo);

    if (aveEncontrada) {
      // A árvore encontrou a ave e a trouxe para a raiz / subnível
      renderizarCards([aveEncontrada]);
      atualizarStatusArvore(`'${aveEncontrada.nome_popular}' encontrada via Splay Tree!`);
    } else {
      // Busca parcial por prefixo nos nomes para tolerância a digitação incompleta
      const filtradas = listaAves.filter(
        (a) =>
          a.nome_popular.toLowerCase().includes(termo.toLowerCase()) ||
          a.titulo.toLowerCase().includes(termo.toLowerCase())
      );
      renderizarCards(filtradas);
    }
  });

  inputBusca.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const termo = inputBusca.value.trim();
      const ave = tree.search(termo);
      if (ave) {
        atualizarStatusArvore(`'${ave.nome_popular}' pesquisada (Enter)`);
        abrirDetalhes(ave);
      }
    }
  });
}

// Inicialização da Página
renderizarCards(listaAves);
atualizarStatusArvore();
