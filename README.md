# PortfolioHUB

Landing page de portfólio pessoal de **Vinícius Eloi Corrêa** — estagiário de
desenvolvimento fullstack e IA (C# / .NET, Next.js e agentes com RAG).
Site estático, sem build, publicado via **GitHub Pages**.

**🔗 Em produção:** https://1234Vini1234.github.io/portfoliohub/

## Stack

- **Front-end:** HTML5 + CSS3 + JavaScript (ES Modules) — sem framework, sem build
- **Dados:** arquivos JSON em `data/` (conteúdo separado da apresentação)
- **Hospedagem:** GitHub Pages (branch `main`)

## Estrutura

```
portfoliohub/
├── index.html              # Estrutura semântica (com data-bind)
├── .nojekyll               # Garante que js/, css/ e data/ sejam servidos
├── css/
│   ├── variables.css       # Design tokens (cores, fontes, espaçamentos)
│   ├── reset.css           # Reset de estilos
│   └── styles.css          # Layout e componentes
├── js/
│   ├── main.js             # Interações (navbar, filtros, scroll reveal)
│   └── render.js           # Carrega os JSON e injeta o conteúdo no DOM
└── data/
    ├── profile.json        # Nome, tagline, sobre e contatos
    ├── skills.json         # Tecnologias agrupadas
    ├── experience.json     # Timeline de experiência/formação
    └── projects.json       # Lista de projetos (o que você mais edita)
```

## Como editar o conteúdo

Não é preciso mexer em HTML/CSS para atualizar o portfólio. Basta editar os JSON:

- **Adicionar um projeto:** acrescente um objeto em [`data/projects.json`](data/projects.json).
  Campos: `nome`, `categoria` (`ia` | `web` | `dados`), `destaque` (bool),
  `resumo`, `descricao`, `destaques` (lista), `stack` (lista), `tipo`,
  `confidencial` (bool) e `links` (objeto `{ "Label": "url" }` — vazio mostra cadeado/"Em breve").
- **Atualizar contatos:** edite `contato` em [`data/profile.json`](data/profile.json)
  (inclua o link real do LinkedIn no lugar do placeholder).
- **Adicionar o CV:** coloque o PDF na raiz e aponte o campo `cv` em `profile.json`
  (ex.: `"cv": "curriculo.pdf"`); se ficar vazio, o botão "Baixar CV" some sozinho.

## Mapa de commits do GitLab (trabalho)

A seção GitHub é ao vivo (API pública). O GitLab da empresa **não pode ser**:
o servidor é interno e a API exigiria um token — que ficaria visível para
qualquer visitante, já que este site é estático e público.

Por isso o mapa de commits vem de um *snapshot*: você roda o script na sua
máquina (com a VPN ligada, se for o caso) e ele grava `data/gitlab.json` com
**apenas datas e contagens** — nenhum nome de projeto, branch ou mensagem de
commit é lido ou gravado.

```powershell
$env:GITLAB_URL   = "https://gitlab.suaempresa.com.br"
$env:GITLAB_TOKEN = "<personal access token, escopo read_api>"
node tools/gitlab-snapshot.mjs
```

Depois é só commitar o `data/gitlab.json` gerado. Variáveis opcionais:
`GITLAB_DAYS` (dias puxados, padrão 365) e `GITLAB_INSECURE=1` (aceita
certificado TLS self-signed, comum em instância interna).

> O token fica só no ambiente do seu terminal — **nunca** o coloque em um
> arquivo do repositório.

Sem o `data/gitlab.json`, o bloco não aparece no site e nada quebra.
Para atualizar o mapa, rode o script de novo e commite.

## Como rodar localmente

O site usa `fetch` para carregar os JSON, então **precisa ser servido via HTTP**
(abrir o `index.html` direto no navegador falha por CORS). Use um servidor estático:

```bash
# Python
python -m http.server 8000

# ou Node
npx serve .
```

Depois acesse ``.

## Deploy

Publicação automática via **GitHub Pages** a partir da branch `main`
(Settings → Pages → Source: `main` / root). A cada `push`, a produção é atualizada.

## Licença

Projeto pessoal. Uso livre para fins educacionais.
