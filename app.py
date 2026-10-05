import streamlit as st
import streamlit.components.v1 as components

# Configuração da Página
st.set_page_config(
    page_title="Catálogo Interativo de Aves",
    layout="wide"
)

# -------------------------------------------------------------------------
# ESTILIZAÇÃO CSS 
# -------------------------------------------------------------------------
st.markdown("""
    <style>
    @import url("https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Manrope:wght@400;500;600;700&display=swap");

    :root {
        --ink: #18352a;
        --moss: #315846;
        --fern: #557765;
        --cream: #f3f1e9;
        --paper: #fbfaf6;
        --clay: #b26b45;
        --line: #dce1d8;
    }

    /* Ocultar elementos nativos do Streamlit que poluem o design limpo */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}

    /* Aplicando fundo e tipografia */
    .stApp {
        background-color: var(--paper);
        color: var(--ink);
        font-family: "Manrope", sans-serif;
    }

    /* Cabeçalhos e Títulos */
    h1, h2, h3, .dm-serif {
        font-family: "DM Serif Display", serif !important;
        color: var(--ink);
    }

    /* Estilização do Header */
    .catalog-header {
        height: 82px;
        padding: 0 40px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid var(--line);
        background: rgba(251,250,246,.94);
        margin-bottom: 0px;
    }

    /* Seção Intro / Banner */
    .intro-container {
        position: relative;
        background-color: var(--cream);
        padding: 80px 70px;
        border-bottom: 1px solid var(--line);
    }
    
    .eyebrow {
        color: var(--clay);
        font-size: 10px;
        font-weight: 700;
        letter-spacing: .22em;
        text-transform: uppercase;
        margin-bottom: 12px;
    }

    /* Cards de Aves */
    .bird-card {
        background: white;
        border: 1px solid var(--line);
        border-radius: 5px;
        overflow: hidden;
        transition: transform .3s, box-shadow .3s;
        margin-bottom: 25px;
    }
    .bird-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 20px 50px rgba(36,56,44,.1);
    }

    /* Personalização de Botões */
    .stButton>button {
        border-radius: 4px;
        font-family: "Manrope", sans-serif;
        font-weight: 600;
        font-size: 11px;
        letter-spacing: .08em;
        text-transform: uppercase;
        background-color: transparent;
        color: var(--ink);
        border: 1px solid var(--line);
        transition: all 0.2s;
    }
    .stButton>button:hover {
        border-color: var(--moss);
        color: var(--moss);
        background-color: rgba(49, 88, 70, 0.03);
    }
    
    /* Botão Primário (Ações em destaque) */
    div.stButton > button[kind="primary"] {
        background-color: var(--ink);
        color: white;
        border: none;
    }
    div.stButton > button[kind="primary"]:hover {
        background-color: var(--moss);
        color: white;
    }

    /* Caixas Informativas (Metadados JSON) com fontes ampliadas */
    .meta-box {
        background: white;
        border: 1px solid var(--line);
        padding: 22px;
        border-radius: 4px;
        margin-bottom: 15px;
    }
    
    .meta-box small {
        color: #929e96; 
        font-size: 10px;
        font-weight: 700; 
        letter-spacing: .16em; 
        text-transform: uppercase;
    }

    .meta-box p {
        margin: 8px 0 0 0; 
        color: #3d5146; 
        font-size: 15px;
        line-height: 1.5;
    }
    
    .scientific-name {
        color: var(--fern);
        font-family: Georgia, serif;
        font-size: 18px;
        font-style: italic;
    }
    </style>
""", unsafe_allow_html=True)

# -------------------------------------------------------------------------
# GERENCIAMENTO DE ESTADO
# -------------------------------------------------------------------------
if 'pagina_atual' not in st.session_state:
    st.session_state['pagina_atual'] = 'home'

if 'ave_selecionada' not in st.session_state:
    st.session_state['ave_selecionada'] = None

# -------------------------------------------------------------------------
# BASE DE DADOS 
# -------------------------------------------------------------------------
def carregar_dados():
    return [
        {
            "id": 1,
            "numero": "001",
            "nome_popular": "Ararajuba",
            "titulo": "Guaruba guarouba",
            "familia": "Psittacidae",
            "genero": "Guaruba",
            "recente": "Recente",
            "imagem": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Red-shouldered_Hawk_2_%28cropped%29.jpg/800px-Red-shouldered_Hawk_2_%28cropped%29.jpg",
            "audio": "https://upload.wikimedia.org/wikipedia/commons/b/b5/Bird_chirping_in_a_forest.ogg",
            "json_info": {
                "Habitat": "Floresta Ombrófila Densa (Amazônia)",
                "Dieta": "Sementes, frutos e bagas silvestres",
                "Status": "Vulnerável (VU)",
                "Descrição": "Ave de plumagem predominantemente amarela viva com asas verde-bandeira."
            },
            "coordenadas": {"lat": -3.4653, "lon": -62.2159, "regiao": "Região Norte do Brasil"}
        },
        {
            "id": 2,
            "numero": "002",
            "nome_popular": "João-de-barro",
            "titulo": "Furnarius rufus",
            "familia": "Furnariidae",
            "genero": "Furnarius",
            "recente": "Destaque",
            "imagem": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Furnarius_rufus_-_Parque_Nacional_Itatiaia_-_Brazil_01.jpg/800px-Furnarius_rufus_-_Parque_Nacional_Itatiaia_-_Brazil_01.jpg",
            "audio": "https://upload.wikimedia.org/wikipedia/commons/3/3b/Furnarius_rufus_call.ogg",
            "json_info": {
                "Habitat": "Áreas abertas, campos e zonas urbanas",
                "Dieta": "Insetos e artrópodes de solo",
                "Status": "Pouco Preocupante (LC)",
                "Descrição": "Famoso pela construção de seu ninho de barro em formato de forno."
            },
            "coordenadas": {"lat": -15.7801, "lon": -47.9292, "regiao": "Brasil Central e Sul"}
        },
        {
            "id": 3,
            "numero": "003",
            "nome_popular": "Tucano-toco",
            "titulo": "Ramphastos toco",
            "familia": "Ramphastidae",
            "genero": "Ramphastos",
            "recente": "Popular",
            "imagem": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Ramphastos_toco_-Pantanal%2C_Brazil_-8-4c_%28cropped%29.jpg/800px-Ramphastos_toco_-Pantanal%2C_Brazil_-8-4c_%28cropped%29.jpg",
            "audio": "https://upload.wikimedia.org/wikipedia/commons/b/b5/Bird_chirping_in_a_forest.ogg",
            "json_info": {
                "Habitat": "Cerrado, matas de galeria e Pantanal",
                "Dieta": "Frutos, ovos e pequenos insetos",
                "Status": "Pouco Preocupante (LC)",
                "Descrição": "Reconhecido mundialmente pelo imenso bico alaranjado."
            },
            "coordenadas": {"lat": -19.0155, "lon": -57.6530, "regiao": "Pantanal / Cerrado"}
        }
    ]

lista_aves = carregar_dados()

# -------------------------------------------------------------------------
# TELA 1: CATÁLOGO PRINCIPAL
# -------------------------------------------------------------------------
if st.session_state['pagina_atual'] == 'home':
    
    st.markdown("""
        <div class="catalog-header">
            <div style="text-align: right; color: #557765; font-size: 10px; letter-spacing: .12em; text-transform: uppercase;">
                CUB-200 DATASET
            </div>
        </div>
    """, unsafe_allow_html=True)

    st.markdown("""
        <div class="intro-container">
            <p class="eyebrow">Pesquisa Hierárquica Avançada</p>
            <h1 style="font-size: 58px; font-weight: 400; line-height: 1; margin: 0 0 15px 0;">
                Descubra a <i>Avifauna</i> Brasileira
            </h1>
            <p style="color: #647168; font-size: 14px; line-height: 1.6; max-width: 500px; margin-bottom: 25px;">
                Explore o acervo multimídia
            </p>
        </div>
    """, unsafe_allow_html=True)

    col_vazia1, col_busca, col_vazia2 = st.columns([1, 2, 1])
    with col_busca:
        st.markdown("<p style='color: #557765; font-size: 14px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase;'>Pesquisar Pássaro </p>", unsafe_allow_html=True)
        termo = st.text_input("", placeholder="Digite o nome popular ou científico", label_visibility="collapsed")
        
        if termo:
            encontrado = next((a for a in lista_aves if termo.lower() in a['titulo'].lower() or termo.lower() in a['nome_popular'].lower()), None)
            if encontrado:
                st.session_state['ave_selecionada'] = encontrado
                st.session_state['pagina_atual'] = 'detalhe'
                st.rerun()

    st.markdown("<div style='padding: 60px 70px 30px;'>", unsafe_allow_html=True)
    st.markdown("<p class='eyebrow'>Acervo Selecionado</p>", unsafe_allow_html=True)
    st.markdown("<h2 style='font-size: 36px; font-weight: 400; margin-bottom: 30px;'>Espécies Registradas</h2>", unsafe_allow_html=True)

    cols = st.columns(3)
    for index, ave in enumerate(lista_aves):
        with cols[index % 3]:
            with st.container():
                st.markdown(f"""
                    <div class="bird-card">
                        <div style="position: relative; height: 240px; background: #dce2da;">
                            <img src="{ave['imagem']}" style="width: 100%; height: 100%; object-fit: cover;">
                            <div style="position: absolute; top: 15px; left: 15px; background: rgba(251,250,246,0.9); padding: 6px 10px; font-size: 8px; font-weight: 700; text-transform: uppercase; border-radius: 2px;">{ave['recente']}</div>
                            <div style="position: absolute; right: 15px; bottom: 10px; color: white; font-family: 'DM Serif Display'; font-size: 22px; text-shadow: 0 1px 8px rgba(0,0,0,0.7);">{ave['numero']}</div>
                        </div>
                        <div style="padding: 22px;">
                            <p class="eyebrow" style="margin-bottom: 6px;">{ave['familia']}</p>
                            <h3 style="font-size: 24px; margin: 0 0 4px 0;">{ave['nome_popular']}</h3>
                            <p class="scientific-name">{ave['titulo']}</p>
                        </div>
                    </div>
                """, unsafe_allow_html=True)
                
                if st.button(f"Ver Detalhes ➔", key=f"card_btn_{ave['id']}", use_container_width=True):
                    st.session_state['ave_selecionada'] = ave
                    st.session_state['pagina_atual'] = 'detalhe'
                    st.rerun()

    st.markdown("</div>", unsafe_allow_html=True)

# -------------------------------------------------------------------------
# TELA 2: PÁGINA DE DETALHES
# -------------------------------------------------------------------------
elif st.session_state['pagina_atual'] == 'detalhe':
    
    # Cria um espaço invisível no topo absoluto e força o foco do Streamlit para ele
    top_anchor = st.empty()
    
    ave = st.session_state['ave_selecionada']

    st.markdown(f"""
        <div class="catalog-header" style="justify-content: space-between;">
            <div class="logo">
                <div class="logo-mark"></div>
                <div>
                    <b>DETALHES</b>
                    <small>REGISTRO #{ave['numero']}</small>
                </div>
            </div>
        </div>
    """, unsafe_allow_html=True)

    col_voltar, col_vazio = st.columns([1, 5])
    with col_voltar:
        if st.button("⬅ Voltar ao Início"):
            st.session_state['pagina_atual'] = 'home'
            st.rerun()

    col_esq, col_dir = st.columns([1.1, 0.9], gap="large")

    with col_esq:
        st.markdown(f"""
            <div style="padding: 20px 0;">
                <p class="eyebrow">Espécie Selecionada</p>
                <h1 style="font-size: 48px; margin: 0 0 5px 0;">{ave['nome_popular']}</h1>
                <p class="scientific-name">{ave['titulo']}</p>
                
                <div style="margin-top: 25px; border-radius: 4px; overflow: hidden; border: 1px solid var(--line);">
                    <img src="{ave['imagem']}" style="width: 100%; height: 380px; object-fit: cover;">
                </div>
            </div>
        """, unsafe_allow_html=True)

        st.markdown("### 🎵 Reproduzir Canto da Espécie")
        try:
            st.audio(ave['audio'])
        except Exception:
            st.warning("Arquivo de áudio não carregado.")
            
        st.markdown("<br>", unsafe_allow_html=True)
        st.markdown("<b>Navegação Sequencial (Skip List):</b>", unsafe_allow_html=True)
        btn_Ant, btn_Prox = st.columns(2)
        with btn_Ant:
            if st.button("Espécie Anterior", use_container_width=True):
                st.toast("Navegando para o registro anterior")
        with btn_Prox:
            if st.button("Próxima Espécie", use_container_width=True):
                st.toast("Navegando para o próximo registro")

    with col_dir:
        st.markdown("""
            <div style="padding: 20px 0;">
                <p class="eyebrow">Dataset CUB-200</p>
                <h2 style="font-size: 32px; margin-bottom: 20px;">Informações Técnicas</h2>
            </div>
        """, unsafe_allow_html=True)

        st.markdown(f"""
            <div class="meta-box">
                <small>FAMÍLIA & GÊNERO</small>
                <p><b>{ave['familia']}</b> ({ave['genero']})</p>
            </div>
        """, unsafe_allow_html=True)

        for chave, valor in ave['json_info'].items():
            st.markdown(f"""
                <div class="meta-box">
                    <small>{chave.upper()}</small>
                    <p>{valor}</p>
                </div>
            """, unsafe_allow_html=True)

        st.markdown("### 🗺️ Distribuição Geográfica")
        st.markdown(f"<p style='font-size: 13px; color: var(--fern);'><b>Região de Ocorrência:</b> {ave['coordenadas']['regiao']}</p>", unsafe_allow_html=True)
        st.map([{"lat": ave['coordenadas']['lat'], "lon": ave['coordenadas']['lon']}], zoom=4, use_container_width=True)
        
    # Escrevemos a âncora no topo após carregar a página para puxar o foco visual
    top_anchor.write("")