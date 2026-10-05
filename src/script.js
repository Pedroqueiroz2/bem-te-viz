// Base de dados simulada (ou que virá do backend da Splay Tree dos colegas)
const listaAves = [
    {
        id: 1,
        numero: "001",
        nome_popular: "Ararajuba",
        titulo: "Guaruba guarouba",
        familia: "Psittacidae",
        genero: "Guaruba",
        recente: "Recente",
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
        nome_popular: "João-de-barro",
        titulo: "Furnarius rufus",
        familia: "Furnariidae",
        genero: "Furnarius",
        recente: "Destaque",
        imagem: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Furnarius_rufus_-_Parque_Nacional_Itatiaia_-_Brazil_01.jpg/800px-Furnarius_rufus_-_Parque_Nacional_Itatiaia_-_Brazil_01.jpg",
        audio: "https://upload.wikimedia.org/wikipedia/commons/3/3b/Furnarius_rufus_call.ogg",
        json_info: {
            Habitat: "Áreas abertas e zonas urbanas",
            Dieta: "Insetos e artrópodes",
            Status: "Pouco Preocupante (LC)"
        }
    }
];

// Renderizar os cards na Home
function renderizarCards(aves) {
    const grid = document.getElementById('grid-aves');
    grid.innerHTML = '';

    aves.forEach(ave => {
        const card = document.createElement('div');
        card.className = 'bird-card';
        card.innerHTML = `
            <div style="position: relative; height: 240px; background: #dce2da;">
                <img src="${ave.imagem}" style="width: 100%; height: 100%; object-fit: cover;">
                <div style="position: absolute; top: 15px; left: 15px; background: rgba(251,250,246,0.9); padding: 6px 10px; font-size: 8px; font-weight: 700; text-transform: uppercase; border-radius: 2px;">${ave.recente}</div>
                <div style="position: absolute; right: 15px; bottom: 10px; color: white; font-family: 'DM Serif Display'; font-size: 22px; text-shadow: 0 1px 8px rgba(0,0,0,0.7);">${ave.numero}</div>
            </div>
            <div style="padding: 22px;">
                <p class="eyebrow" style="margin-bottom: 6px;">${ave.familia}</p>
                <h3 style="font-size: 24px; margin: 0 0 4px 0;">${ave.nome_popular}</h3>
                <p class="scientific-name">${ave.titulo}</p>
            </div>
        `;
        
        // Evento de clique para ir aos detalhes
        card.addEventListener('click', () => abrirDetalhes(ave));
        grid.appendChild(card);
    });
}

function abrirDetalhes(ave) {
    document.getElementById('tela-home').style.display = 'none';
    document.getElementById('tela-detalhe').style.display = 'block';
    window.scrollTo(0, 0); // Garante que abre no topo

    document.getElementById('detalhe-numero').innerText = `REGISTRO #${ave.numero}`;
    document.getElementById('detalhe-nome').innerText = ave.nome_popular;
    document.getElementById('detalhe-cientifico').innerText = ave.titulo;
    document.getElementById('detalhe-img').src = ave.imagem;
    document.getElementById('detalhe-audio').src = ave.audio;
    document.getElementById('detalhe-familia-genero').innerHTML = `<b>${ave.familia}</b> (${ave.genero})`;
    document.getElementById('detalhe-habitat').innerText = ave.json_info.Habitat;
    document.getElementById('detalhe-dieta').innerText = ave.json_info.Dieta;
    document.getElementById('detalhe-status').innerText = ave.json_info.Status;
}

// Botão Voltar
document.getElementById('btn-voltar').addEventListener('click', () => {
    document.getElementById('tela-detalhe').style.display = 'none';
    document.getElementById('tela-home').style.display = 'block';
    window.scrollTo(0, 0);
});

// Inicializar aplicação
renderizarCards(listaAves);