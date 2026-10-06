import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SplayTree } from "./src/splay-tree.js";

const root = path.dirname(fileURLToPath(import.meta.url));
const catalog = JSON.parse(fs.readFileSync(path.join(root, "data/demo/catalog.json"), "utf8"));
const tree = new SplayTree();
for (const bird of catalog.birds) tree.insert(bird);

const popular = catalog.birds.find((bird) => bird.id === "1");
const occasional = catalog.birds.find((bird) => bird.id === "4");
const challenger = catalog.birds.find((bird) => bird.id === "5");
const watched = [popular, occasional, challenger];

function printState(label) {
  console.log(`\n${label}`);
  console.log(`Raiz: ${tree.rootSpecies} | altura: ${tree.height()} | espécies: ${tree.size}`);
  for (const bird of watched) {
    console.log(`- ${bird.species}: profundidade ${tree.depth(bird.species)}, acessos ${tree.getAccessCount(bird.species)}`);
  }
}

console.log("Demonstração da Splay Tree adaptada usando espécies do catálogo CUB-200.");
printState("Após carregar o catálogo");

console.log(`\nConsultando ${popular.species} repetidamente...`);
for (let i = 0; i < 5; i++) tree.search(popular.species);
printState("Espécie popular consolidada na raiz");

console.log(`\nAcesso ocasional a ${occasional.species}...`);
tree.search(occasional.species);
printState("A espécie popular permanece priorizada");

console.log(`\nAcessos repetidos a ${challenger.species} até alcançar a prioridade da raiz...`);
while (tree.getAccessCount(challenger.species) < tree.getAccessCount(popular.species)) {
  tree.search(challenger.species);
}
tree.search(challenger.species);
printState("A espécie que ganhou frequência é promovida");
