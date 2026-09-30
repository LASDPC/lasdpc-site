# Reunião 06 — Busca, filtros, CI/CD e próximos passos

**Data:** 2026-05-28

**Orientador:** Prof. Dr. Júlio Cezar Estrella

**Equipe:** Luiz Felipe Diniz Costa

**Sprint:** 2026-05-14 → 2026-05-28

## O que foi entregue

- Busca em Blog, Pessoas e Pesquisa.

- Filtros e paginação:

- Data de saída no formulário de pessoas e exibição de ex-membros (alumni).

- Campos filtráveis nas publicações; paginação na página de Pesquisa.

- Filtro por tags, ano e autor no Blog, com controles de paginação.

- Componente FilterCombobox substituindo os filtros de área/ano.

- Filtros avançados com suporte a regex e filtro por categoria no Blog.

- CI/CD (GitHub Actions): workflow de deploy na VM local (runner self-hosted) — sincroniza arquivos via rsync e sobe a infraestrutura (MongoDB e MinIO) via docker compose a cada push na main.

- Refinos de UI: componente PageHeader consistente com subtítulos em todas as páginas; LabSlider na home; página de História com metadados, IntersectionObserver e rastreio de scroll; animações fadeUp otimizadas.

## Feedbacks e pedidos do Prof. Júlio

- Conjunto de filtros e o CI/CD aprovados; a base do site está madura.

- Observabilidade / métricas: expor métricas de uso das máquinas do cluster (montar a stack de observabilidade — Prometheus, Grafana, cAdvisor).

- Consolidar o CI/CD e garantir a subida automática do sistema após reinício da máquina.

- SEO: reforçar o posicionamento para buscas como "USP HPC", "USP computação distribuída" e "USP Cluster".

### Ideias além do site (visão do Prof. Júlio)

- MCP e Skills de IA para acessar recursos do cluster de forma mais fácil.

- Dev-tools do LASDPC para pesquisadores usarem a infra com apoio de agentes de IA.

- Infraestrutura para agentes de IA interagirem com a infra do LASDPC.

- Objetivo: o pesquisador pensa no problema, na hipótese e em como validar — não em como rodar a infra. A orquestração fica a cargo da IA.

- Automatizar tarefas repetitivas com IA e oferecer ferramentas via MCP/Skills.

- Usar IA para experimentos e para analisar métricas e dados.

## Decisões

- Encerrada a fase de construção do site; abrir a frente de observabilidade e a exploração das ideias de IA/agentes sobre a infraestrutura.

## Próximos passos

- [ ] Stack de observabilidade (Prometheus + Grafana + cAdvisor) com dashboards de uso das máquinas.

- [ ] Subida automática do sistema no boot da máquina.

- [ ] Trabalho de SEO focado nos termos de HPC/computação distribuída.

- [ ] Prova de conceito de MCP/Skills para acesso ao cluster.
