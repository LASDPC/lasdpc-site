# Deploy via GitHub Actions

## Fluxo atual

O arquivo `.github/workflows/main.yml` é acionado por push na branch `main` e usa um runner `self-hosted` na VM local. Ele:

1. Faz checkout do código.
2. Sincroniza o repositório com `/home/lasdpc/lasdpc-site/` via `rsync -av --delete`, excluindo `backend/.env`, `frontend/.env`, o ambiente virtual e `node_modules`.
3. Executa `docker compose up -d` na pasta de produção para manter MongoDB e MinIO ativos.
4. Em `frontend/`, executa `npm install` e `npm run build`.
5. Em `backend/`, ativa `venv`, instala `requirements.txt` e reinicia `lasdpc-backend.service` com `systemctl`.

## Configuração necessária na VM

O runner precisa de acesso ao repositório, Docker, Node.js, Python e permissão para reiniciar o serviço do backend. A pasta `/home/lasdpc/lasdpc-site/` precisa existir. Os arquivos `.env` de produção devem ser criados nessa pasta e mantidos fora do Git. O serviço `lasdpc-backend.service` e o ambiente virtual `backend/venv` precisam existir antes do deploy.

O workflow atual faz build do frontend e reinicia o backend. Ele **não executa** o reset de dados nem o script de seed. Também não configura, por si só, proxy reverso, TLS, observabilidade ou início automático do frontend após boot. Esses itens dependem da configuração da VM.

## Verificação

Após o workflow, confira o status dos containers com `docker compose ps`, do backend com `systemctl status lasdpc-backend.service` e da API pelo endpoint `/api/v1/health`. Confirme também que o build do frontend serviu os arquivos novos e que as URLs públicas da API e do MinIO em `frontend/.env` apontam para os endereços corretos.
