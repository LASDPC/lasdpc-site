# Reunião 03 — Back-end, área administrativa e usuários

**Data:** 2026-04-16

**Orientador:** Prof. Dr. Júlio Cezar Estrella

**Equipe:** Luiz Felipe Diniz Costa, João Pedro Godoy

**Sprint:** 2026-04-02 → 2026-04-16

## O que foi entregue

Back-end e área administrativa no ar, integrados ao front:

- Back-end FastAPI + MongoDB com interface administrativa de CRUD para os recursos do site.

- Login e menu de avatar do usuário; autenticação via JWT.

- Bootstrap de admin seguro, com validação por token, e auto-bootstrap do usuário admin na subida da aplicação.

- Endpoint de estatísticas alimentando os números dinâmicos da home.

- Editor markdown com preview, modos de visualização, auto-resize e suporte a imagem de capa para o blog.

- Página de edição administrativa dedicada, com troca de idioma (PT/EN) no próprio formulário.

- Configuração de URL da API por ambiente e ajustes no docker-compose.

- Modo de manutenção (coming-soon para visitantes; admin acessa após login).

- Modelo de usuário unificado com papéis (roles), restrição de acesso à seção de docs, página de perfil e upload de foto.

- Formulários de infraestrutura e fluxo de solicitação de novo usuário.

## Feedbacks e pedidos do Prof. Júlio

- Boa evolução; a plataforma já permite gerenciar conteúdo de ponta a ponta.

- Avançar para as funcionalidades específicas do laboratório:

- Reserva de salas/espaços — necessidade recorrente do grupo.

- Página de História do LASDPC, contando a trajetória do grupo.

- Cadastro de pessoas deve capturar orientador acadêmico e **nível acadêmico** (graduação, mestrado, doutorado…).

- Padronizar os cabeçalhos das páginas para dar consistência visual.

## Decisões

- Cauê assume o módulo de reserva de salas (calendário e eventos).

- Página de História e ajustes de cadastro/headers em paralelo.

## Próximos passos (para a Reunião 04)

- [ ] Sistema de reserva de salas com calendário e participantes.

- [ ] Página de calendário do cluster.

- [ ] Página de História do grupo.

- [ ] Cadastro com orientador e nível acadêmico.

- [ ] Cabeçalhos com ícones nas páginas principais.
