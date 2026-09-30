# Reunião 02 — Front-end MVP

**Data:** 2026-04-02

**Orientador:** Prof. Dr. Júlio Cezar Estrella

**Equipe:** Luiz Felipe Diniz Costa, João Pedro Godoy

**Sprint:** 2026-03-19 → 2026-04-02

## O que foi entregue

Milestone 1 (Front-end MVP) apresentado e navegável:

- Base do front-end montada com React + Vite + TypeScript, ShadCN/UI (Radix + Tailwind CSS).

- Páginas iniciais estruturadas com o conteúdo do site antigo mais textos novos.

- Ajustes de layout do header (grid, centralização da navegação) e tratamento de overflow dos cards.

- Loading skeletons em todas as páginas, para melhorar a percepção de carregamento.

## Feedbacks e pedidos do Prof. Júlio

- MVP visual aprovado como ponto de partida; seguir refinando o design nas próximas sprints.

- Evoluir do site estático para uma aplicação com conteúdo gerenciável: é preciso uma área administrativa para cadastrar/editar o conteúdo (pessoas, publicações, projetos, blog, infraestrutura) sem mexer no código.

- Autenticação para proteger a área administrativa.

- Garantir a base bilíngue (PT-BR / EN) em todo conteúdo editável.

## Decisões

- Iniciar o back-end em FastAPI + MongoDB já nesta próxima quinzena.

- Modelo de conteúdo bilíngue por campos pareados (ex.: title/titlePt).

## Próximos passos (para a Reunião 03)

- [ ] Subir o back-end FastAPI com MongoDB.

- [ ] Tela de login e autenticação (JWT).

- [ ] Área administrativa com CRUD dos recursos.

- [ ] Estatísticas dinâmicas na home.

- [ ] Editor de conteúdo (markdown) com suporte bilíngue.
