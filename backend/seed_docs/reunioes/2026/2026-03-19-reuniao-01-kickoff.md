# Reunião 01 — Kickoff

**Data:** 2026-03-19

**Orientador:** Prof. Dr. Júlio Cezar Estrella

**Equipe:** Luiz Felipe Diniz Costa, Cauê Paiva

**Sprint:** definição do projeto (sem entregas anteriores)

## Contexto

Primeira reunião do projeto de reformulação do site do LASDPC. O site atual está defasado; usamos como referência o site vigente e um snapshot do Wayback Machine para recuperar conteúdo histórico. Referência de design/estrutura: site do LABIC.

## Escopo definido

### Requisitos funcionais

- Site responsivo, com inspiração no site do LABIC.

- Contar a história do grupo LASDPC.

- Links de redes sociais.

- Formulários e reserva de espaço (salas/laboratório).

- Seção de impacto dos projetos.

- Recursos de infraestrutura (clusters/equipamentos).

- Aba de atividades de extensão feitas por alunos das disciplinas dos docentes.

- Tradução PT-BR + EN em todo o conteúdo.

- Área de docentes: puxar e renderizar artigos do Lattes; links para Lattes, ORCID e Google Scholar; conteúdo customizado por docente.

### SEO / posicionamento

- Surfar no hype de IA (treinamento de LLMs com HPC).

- Buscas como "USP HPC", "USP computação distribuída", "USP Cluster" devem levar ao laboratório.

### Requisitos não funcionais

- CI/CD para atualização automática.

- Storage persistente.

- Subida automática do sistema quando a máquina reinicia.

- Stack de observabilidade (dashboards).

### Stack acordada

- Front-end: React + Vite; conteúdo em arquivos JSON.

- Back-end: Python + FastAPI.

- Banco de dados: a definir.

- CI/CD: GitHub Actions.

- Observabilidade: Grafana, Prometheus, cAdvisor.

- Design/identidade: logotipo e cores podem mudar (Figma + IA para gerar propostas). Será criado um espaço compartilhado no Figma — provavelmente o do Prof. Júlio Estrella.

## Decisões

- Primeiro marco (Milestone 1): Front-end MVP — páginas iniciais prontas, com texto do site antigo somados a alguns textos novos e design novo.

- Conteúdo textual e bilíngue mantido em JSON no front, sem depender do back nesta primeira fase.

## Próximos passos (para a Reunião 02)

- [ ] Montar a base do front-end (React + Vite + TypeScript).

- [ ] Estruturar as páginas iniciais com o conteúdo recuperado.

- [ ] Aplicar identidade visual inicial e layout responsivo.
