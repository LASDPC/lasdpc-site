# Reunião 05 — Afiliação, storage e testes

**Data:** 2026-05-14

**Orientador:** Prof. Dr. Júlio Cezar Estrella

**Equipe:** Luiz Felipe Diniz Costa, Cauê Paiva

**Sprint:** 2026-04-30 → 2026-05-14

## O que foi entregue

Atendendo aos feedbacks da reunião anterior:

- Afiliação: componente de input de afiliação e seletor de termo de perfil, com tratamento de tipo de usuário nos formulários da área administrativa.

- Storage persistente: integração do MinIO (storage de objetos) para arquivos e uploads.

- Testes automatizados cobrindo termos de perfil, eventos de sala e salas.

- Padronização e refatoração dos arquivos markdown para melhorar clareza e formatação.

## Feedbacks e pedidos do Prof. Júlio

- Afiliação e storage no caminho certo; seguir amarrando a experiência das listagens públicas.

- Melhorar a navegação e a busca nas páginas de Pessoas, Pesquisa e Blog — o volume de conteúdo está crescendo e é preciso filtrar/paginar.

- Diferenciar membros ativos de ex-membros (alumni) — registrar data de saída.

- Preparar publicações para filtragem (área, ano, autor).

- Retomar o CI/CD para automatizar o deploy na infraestrutura do laboratório.

## Decisões

- Próxima sprint focada em busca, filtros, paginação e no pipeline de CI/CD.

## Próximos passos (para a Reunião 06)

- [ ] Busca em Blog, Pessoas e Pesquisa.

- [ ] Data de saída / distinção de ex-membros no cadastro de pessoas.

- [ ] Campos filtráveis em publicações + paginação.

- [ ] Pipeline de CI/CD (GitHub Actions) para deploy automático.
