# Bem-te-viz

Catálogo multimídia do CUB-200-2011. O Node.js entrega a página HTML/CSS, uma API local do catálogo e as mídias selecionadas. A interface pesquisa as espécies com a Splay Tree.

## Executar

Requer Node.js 18 ou mais recente.

```sh
npm start
```

Abra `http://localhost:3000`. O app não chama Kaggle nem depende de um notebook ativo. Sem pacote processado, ele abre a amostra em `data/demo` e identifica isso com o selo “amostra local”.

## Usar um pacote processado do Kaggle

Extraia o ZIP exportado pelo notebook para que a estrutura fique assim:

```text
data/processed/bem-te-viz-package/catalog.json
data/processed/bem-te-viz-package/manifest.json
data/processed/bem-te-viz-package/media/...
```

O servidor valida o catálogo, o manifesto e cada referência de mídia ao iniciar. Se o pacote estiver ausente ou inválido, carrega `data/demo` automaticamente. Também é possível apontar para outro diretório:

```sh
BIRD_CATALOG_DIR=/caminho/bem-te-viz-package npm start
```

No PowerShell:

```powershell
$env:BIRD_CATALOG_DIR = "C:\caminho\bem-te-viz-package"
npm start
```

O diretório `data/processed` é ignorado pelo Git para não versionar exportações maiores. A amostra em `data/demo` contém as 200 espécies, 12 imagens e 8 gravações selecionadas, totalizando cerca de 6,6 MB. Ela é somente o fallback de emergência.

## Gerar o pacote completo no Kaggle

Use `notebooks/prepare-kaggle.ipynb` no notebook que já tem os dois datasets anexados. Ele está configurado para exportar todas as imagens do CUB e uma gravação de áudio pequena por espécie quando houver correspondência. A chave primária é o `class_id` compartilhado, conferido com o caminho/ID do áudio. Não precisa copiar os 31 GB de gravações para ultrapassar 10.000 mídias: as 11.788 imagens CUB já passam desse mínimo. Confira os termos de uso e mude `ALLOW_MEDIA_EXPORT` para `True` antes de executar.

Depois de baixar `bem-te-viz-package.zip` da saída do Kaggle, extraia-o em `data/processed/`. A página de detalhes mostra a galeria em blocos de 12 imagens por vez, sem criar milhares de elementos na tela de uma só vez.

## Testes

```sh
npm test          # estruturas de dados, carregador do catálogo e servidor
npm run test:e2e  # interface em um Chrome real (desktop), com um catálogo de teste
```

Os testes de interface precisam do Google Chrome instalado (ou da variável `CHROME_PATH` apontando para ele); sem ele, são pulados. Cobrem a busca, a página da espécie, o carrossel, as galerias, a ordem do ranking, o histórico, o contador, o F5 e o reinício do servidor, além de casos de borda (ave sem foto ou áudio, nome com HTML, endereço inexistente, armazenamento do navegador bloqueado). Não há testes para celular.

## Fontes e créditos

Os metadados e imagens vêm do CUB-200-2011 (`wenewone/cub2002011` no Kaggle); os áudios vêm do `gevorgalaverdyan/cub-200-bird-audio-dataset`. O catálogo não inventa nome científico, família, habitat, dieta ou estado de conservação porque esses campos não estão no pacote processado recebido.

Consulte `data/demo/CREDITS.md` antes de redistribuir a amostra. Em particular, o CSV de áudio anexado não trouxe o nome do gravador nem a licença individual das gravações; a interface mantém links para as páginas de origem Xeno-Canto, mas esses créditos precisam ser verificados antes de publicar a mídia.
