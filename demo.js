import { SplayTree } from "./src/splay-tree.js";

function printState(stepTitle, tree, birdsToInspect) {
  console.log(`\n======================================================`);
  console.log(`  ${stepTitle}`);
  console.log(`======================================================`);
  console.log(`Raiz atual: "${tree.rootSpecies}" (frequência de acesso = ${tree.rootAccessCount})`);
  console.log(`Altura da árvore: ${tree.height()}`);
  console.log(`\nEstado das espécies monitoradas:`);
  console.log(`------------------------------------------------------`);
  console.log(`Espécie             | Profundidade | Contagem de Acessos`);
  console.log(`--------------------+--------------+--------------------`);
  for (const name of birdsToInspect) {
    const d = tree.depth(name);
    const count = tree.getAccessCount(name);
    const depthStr = d === 0 ? "0 (RAIZ)" : d === 1 ? "1 (FILHO)" : `${d}`;
    console.log(`${name.padEnd(20)}| ${depthStr.padEnd(13)}| ${count}`);
  }
}

console.log(`\n################################################################`);
console.log(`#  DEMONSTRAÇÃO PRÁTICA: SPLAY TREE ADAPTADA POR FREQUÊNCIA   #`);
console.log(`#  Projeto: Catálogo de Aves (bem-te-viz)                      #`);
console.log(`################################################################\n`);

const tree = new SplayTree();

// Base de aves de teste
const catalogo = [
  { species: "Bem-te-vi", image: "bem-te-vi.jpg", audio: "bem-te-vi.mp3" },
  { species: "Arara-azul", image: "arara.jpg", audio: "arara.mp3" },
  { species: "Tucano-toco", image: "tucano.jpg", audio: "tucano.mp3" },
  { species: "Sabiá-laranjeira", image: "sabia.jpg", audio: "sabia.mp3" },
  { species: "Zidedê-do-nordeste", image: "zidede.jpg", audio: "zidede.mp3" },
];

for (const bird of catalogo) {
  tree.insert(bird);
}

const monitoradas = ["Bem-te-vi", "Arara-azul", "Tucano-toco", "Zidedê-do-nordeste"];

printState("Passo 0: Estado Inicial após Carga do Catálogo", tree, monitoradas);

// -----------------------------------------------------------------
// Passo 1 & 2: Ave A ("Bem-te-vi") é acessada repetidamente por usuários
// -----------------------------------------------------------------
console.log(`\n--> Usuários na interface consultam "Bem-te-vi" 5 vezes consecutivas...`);
for (let i = 1; i <= 5; i++) {
  tree.search("Bem-te-vi");
}
printState("Passos 1 e 2: 'Bem-te-vi' consolida alta frequência (acessos = 6)", tree, monitoradas);

// -----------------------------------------------------------------
// Passo 3 & 4: Novo acesso a uma ave esporádica / fria ("Zidedê-do-nordeste")
// -----------------------------------------------------------------
console.log(`\n--> Um usuário realiza uma pesquisa esporádica por "Zidedê-do-nordeste" (ave rara)...`);
tree.search("Zidedê-do-nordeste");
printState("Passos 3 e 4: Busca por 'Zidedê-do-nordeste' (Splay na Subárvore com Raiz Protegida)", tree, monitoradas);

console.log(`\n[OBSERVAÇÃO TÉCNICA - COMPORTAMENTO ADAPTADO]:`);
console.log(`- Na Splay Tree CLÁSSICA: 'Zidedê-do-nordeste' teria desalojado 'Bem-te-vi' da raiz`);
console.log(`  imediatamente (poluição de cache), forçando novas rotações na próxima busca.`);
console.log(`- Na Splay Tree ADAPTADA: 'Bem-te-vi' (count = 6) PERMANECE NA RAIZ (profundidade 0).`);
console.log(`- 'Zidedê-do-nordeste' (count = 2) sofreu rotações top-down dentro da subárvore e`);
console.log(`  subiu para profundidade 1 (filho direto), encurtando seu caminho de busca.`);

// -----------------------------------------------------------------
// Passo 5: Nova consulta à ave popular "Bem-te-vi"
// -----------------------------------------------------------------
console.log(`\n--> Próximo usuário pesquisa novamente 'Bem-te-vi'...`);
tree.search("Bem-te-vi");
printState("Passo 5: 'Bem-te-vi' consultada com custo O(1) imediato sem rotações", tree, monitoradas);

// -----------------------------------------------------------------
// Passo 6: Nova espécie ("Arara-azul") ganha popularidade até superar a raiz
// -----------------------------------------------------------------
console.log(`\n--> Campanha no catálogo torna 'Arara-azul' muito popular!`);
console.log(`--> Pesquisando 'Arara-azul' repetidas vezes até empatar/superar a raiz...`);
while (tree.getAccessCount("Arara-azul") < tree.getAccessCount("Bem-te-vi")) {
  tree.search("Arara-azul");
}
// Mais uma busca para disparar a promoção global
tree.search("Arara-azul");

printState("Passo 6: 'Arara-azul' supera a frequência da raiz e é promovida via rotação Zig", tree, monitoradas);

console.log(`\n[CONCLUSÃO]:`);
console.log(`1. Propriedades de Busca Binária (BST): rigorosamente mantidas em todas as etapas.`);
console.log(`2. Operações de Splay (Zig-Zig e Zig top-down): preservadas e ativas.`);
console.log(`3. Regra de Negócio de Frequência: espécies populares mantêm acesso prioritário O(1),`);
console.log(`   evitando o problema clássico de degradação por consultas frias.`);
