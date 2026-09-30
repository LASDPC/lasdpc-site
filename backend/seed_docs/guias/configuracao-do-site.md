# Configuração do site LASDPC

## Componentes

O site usa React 18, TypeScript e Vite no frontend; FastAPI no backend; MongoDB para dados; e MinIO para imagens. O frontend chama a API em `/api/v1/`. No desenvolvimento, o Vite encaminha `/api` para a porta 8000.

## Desenvolvimento local

1. Copie `backend/.env.example` para `backend/.env` e configure senhas e URLs. O arquivo é usado pelo backend e pelo Docker Compose. Não publique esse arquivo.
2. Execute `docker compose up -d` na raiz do repositório. O MongoDB fica em `localhost:27018`; a API do MinIO, em `localhost:9000`; e o console, em `localhost:9001`.
3. Em `backend/`, crie um ambiente virtual, instale `requirements.txt` e execute `uvicorn main:app --reload --port 8000`.
4. Em `frontend/`, instale as dependências com `npm install` e execute `npm run dev`. O servidor de desenvolvimento usa a porta 8080.

O arquivo `dev.sh` automatiza essa preparação local. `backend/.env` define `MONGO_URI`, `MONGO_DB_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `JWT_SECRET`, `MINIO_ENDPOINT`, `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD` e `MINIO_BUCKET`. `frontend/.env` pode definir `VITE_API_URL`, `VITE_MINIO_PUBLIC_URL` e `VITE_MAINTENANCE_MODE`.

## Conteúdo e acesso

Os recursos públicos guardam os textos em inglês no campo base e os textos em português no campo com sufixo `Pt`. Os Docs são arquivos Markdown de idioma único, com caminho como `reunioes/2026/ata.md`, e exigem login para leitura. Os objetos de imagem ficam no MinIO; o MongoDB armazena as chaves desses objetos.

Se `ADMIN_EMAIL` e `ADMIN_PASSWORD` estiverem configurados, o backend cria ou atualiza a conta administrativa na inicialização. O modo de manutenção é ativado com `VITE_MAINTENANCE_MODE=true` no build do frontend; administradores ainda podem entrar por `/login`.

## Dados de exemplo

O script `./reset-e-popular.sh --yes` recria o banco configurado e limpa o bucket MinIO configurado. Ele importa professores, um aluno ativo, duas publicações, projetos, infraestrutura, blog e Docs. **A execução apaga todas as contas, reservas, solicitações e alterações feitas no painel nesse banco.** Confira o banco e o bucket indicados pelo script antes de executá-lo.
