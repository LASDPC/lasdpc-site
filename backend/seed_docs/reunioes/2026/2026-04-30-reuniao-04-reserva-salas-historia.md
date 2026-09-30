# Reunião 04 — Reserva de salas e História do grupo

**Data:** 2026-04-30

**Orientador:** Prof. Dr. Júlio Cezar Estrella

**Equipe:** Luiz Felipe Diniz Costa, Cauê Paiva, João Pedro Godoy

**Sprint:** 2026-04-16 → 2026-04-30

## O que foi entregue

- Sistema de reserva de salas completo:

- Cadastro de eventos e reserva de salas.

- Adição de participantes aos eventos.

- Expiração automática (TTL) e correção de bugs relacionados.

- Edição de nome, data e horário dos eventos.

- Criação de evento clicando diretamente na grade do calendário.

- Modal de confirmação antes de excluir um evento (no lugar do alerta do navegador) e melhorias de ícones/i18n na UI de criação.

- Página de calendário do cluster, integrada às funcionalidades existentes.

- Cadastro com seleção de orientador e nível acadêmico.

- Página de História do grupo, com layout e localização iniciais.

- Cabeçalhos com ícones nas páginas Blog, Contato, Docs, História, Pessoas, Pesquisa e Reserva.

- Melhorias na conexão com o MongoDB e na gestão do usuário admin.

## Feedbacks e pedidos do Prof. Júlio

Feedbacks levantados nesta reunião:

- Reserva de salas: manter o sistema para cadastrar salas.

- História: colocar uma galeria na parte de baixo da seção de História.

- Auditoria:

- Ao adicionar uma nova área de pesquisa, registrar em log para auditoria.

- Logs em storage append-only para auditoria.

- Perfil de pessoas: tornar **Lattes, Google Scholar, GitHub e ORCID obrigatórios** ao gerar um perfil.

- Afiliação — o cadastro deve contemplar:

- Orientador acadêmico.

- Organização da USP (técnicos, grupos de extensão…).

- Organização externa (universidade, empresa).

- Página inicial: incluir manchetes e notícias curtas de alto impacto.

- Ex.: "Aluno da USP usa IA para criar irrigador que economiza 30%".

- Integração com Lattes e bibliotecas de pesquisa: focar em trazer links e importar os N artigos mais importantes quando o pesquisador faz o cadastro.

## Decisões

- Priorizar afiliação, storage persistente (para anexos/auditoria) e cobertura de testes na próxima quinzena.

- Galeria da História e integração Lattes entram no backlog subsequente.

## Próximos passos (para a Reunião 05)

- [ ] Campo de afiliação (orientador / organização USP / organização externa).

- [ ] Storage de objetos persistente (MinIO) para arquivos e uploads.

- [ ] Tornar Lattes/Scholar/GitHub/ORCID obrigatórios no perfil.

- [ ] Testes automatizados dos módulos críticos (salas, perfil).

- [ ] Base para logs de auditoria append-only.
