# Conteúdo do LaSDPC antigo - Organizado

Este diretório reúne, em formato Markdown limpo, todo o conteúdo recuperado do
site antigo do LaSDPC (versão "clássica" 1990–2016) e do site Smart-LaSDPC
(2020–2024). O material foi separado em duas grandes categorias, espelhando a
arquitetura do site atual (FastAPI + MongoDB no backend, React/Vite no
frontend).

---

## Estrutura

```
organizado/
├── INDEX.md                       ← este arquivo
├── banco-de-dados/                ← vai virar registro no Mongo via /api/v1/*
│   ├── pessoas/                   ← coleção users (role: docente | aluno_ativo | alumni)
│   │   ├── corpo-docente.md
│   │   ├── doutorandos.md
│   │   ├── mestrandos.md
│   │   ├── graduandos-iniciacao.md
│   │   ├── alumni.md
│   │   └── smart-lasdpc-pesquisadores.md
│   ├── publicacoes/               ← coleção publications
│   │   ├── publicacoes-1988-2014.md
│   │   └── publicacoes-smart-lasdpc.md
│   ├── projetos/                  ← coleção projects
│   │   ├── smart-lasdpc.md
│   │   ├── oer-sistemas-operacionais.md
│   │   └── lasdpc-games.md
│   ├── infraestrutura/            ← coleção infrastructure/clusters
│   │   └── clusters-e-equipamentos.md
│   └── docs/                      ← coleção docs (suporte/wiki)
│       ├── solicitar-conta.md
│       └── trocar-senha.md
├── frontend/                      ← textos fixos/i18n/config de páginas
│   ├── home.md
│   ├── historia.md
│   ├── pesquisa.md
│   ├── contato.md
│   ├── smart-lasdpc-sobre.md
│   ├── computacao-na-educacao.md
│   ├── laboratorio-ambiente.md
│   └── links-externos.md
└── imagens/                       ← imagens extraídas (rodando ./extrair-imagens.sh)
```

---

## Banco de Dados - o que vira registro

| Arquivo | Coleção alvo | Modelo (backend) |
|---|---|---|
| `pessoas/*.md`                              | `users`            | `UserCreate` |
| `publicacoes/*.md`                          | `publications`     | `PublicationCreate` |
| `projetos/*.md`                             | `projects`         | `ProjectCreate` |
| `infraestrutura/clusters-e-equipamentos.md` | `infrastructure`   | `ClusterCreate` |
| `docs/*.md`                                 | `docs`             | `DocCreate` |

Cada arquivo nessa pasta contém, no topo, um bloco YAML/frontmatter sugerindo
o mapeamento de campos. Os itens individuais ficam em listas/tabelas para
facilitar um script de seed futuro.

## Frontend - o que vira texto da página

Cada arquivo corresponde a uma página/seção do site atual. O texto fica em
pares EN/PT seguindo a convenção do projeto (`field` em inglês,
`fieldPt` em português).

| Arquivo | Página/seção atual |
|---|---|
| `home.md`                  | `HomePage.tsx`              |
| `historia.md`              | `HistoriaPage.tsx`          |
| `pesquisa.md`              | `ResearchPage.tsx`          |
| `contato.md`               | `ContactPage.tsx`           |
| `smart-lasdpc-sobre.md`    | seção "Sobre" / hero        |
| `computacao-na-educacao.md`| projeto/landing OER         |
| `laboratorio-ambiente.md`  | `InfrastructurePage.tsx`    |
| `links-externos.md`        | rodapé / barra superior     |

## Imagens

O script `extrair-imagens.sh` (na raiz da pasta `conteudo lspdc antigo/`)
copia todas as imagens úteis (`.jpg`, `.png`) dos diretórios `*_files/` para
`organizado/imagens/`, organizadas por origem. Ignora *.js, *.css, marcadores
de mapa (Leaflet) e tiles. Use `--dry-run` para apenas listar.

## Próximos passos sugeridos

1. Revisar cada `.md` em `banco-de-dados/` e marcar o que entra no seed.
2. Escrever um script `backend/scripts/seed_legacy.py` que lê esses .md e
   popula o Mongo via os models existentes.
3. Em `frontend/`, copiar o texto para `src/data/i18n/*.json` ou para o
   conteúdo das páginas correspondentes.
4. Subir as imagens revisadas para o MinIO/uploads e atualizar URLs no seed.
