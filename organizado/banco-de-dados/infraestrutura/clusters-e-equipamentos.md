# Infraestrutura LaSDPC — Clusters e Equipamentos

> **Destino:** coleção `infrastructure` (clusters) — `backend/models/infrastructure.py :: ClusterCreate`
> **Fontes:** `info.md`, `resources.md`, `About the project.html`

## Visão geral (do `info.md`, 2016)

- **80 computadores** distribuídos no laboratório.
- **3 clusters** dedicados a processamento paralelo.
- **4 firewalls**.
- **3 storages**.

## Salas físicas

### Sala 1006

24 computadores e o **data center principal** (sala adaptada para manter a
temperatura dos servidores), com cinco aparelhos de ar-condicionado — três
no datacenter e dois externos. Fotos disponíveis em
`About the project_files/lasdpc_1006_{1,2,3}.jpg`.

### Sala 1008

5 computadores, dois monitores grandes e um **datacenter secundário** que
suporta atividades de pesquisa e ensino. Possui ar-condicionado duplo e
funciona como sala de convivência para alunos e professores
(geladeira, chaleira, máquina de café). Fotos em
`About the project_files/lasdpc_1008_{1,2,3}.jpg`.

## Clusters

### Cosmos

```yaml
name:            "Cosmos"
description:     "High-performance cluster used by LaSDPC researchers and students for parallel computing experiments."
descriptionPt:   "Cluster de alto desempenho usado por pesquisadores e estudantes do LaSDPC para experimentos de computação paralela."
status:          "online"
custom_fields:
  - { name: "password_change_url",
      label: "Change password",
      labelPt: "Trocar senha",
      type: "text" }
```

### Andromeda

```yaml
name:            "Andromeda"
description:     "Cluster dedicated to LaSDPC research and partner laboratories."
descriptionPt:   "Cluster dedicado às pesquisas do LaSDPC e laboratórios parceiros."
status:          "online"
```

### Halley (no `info.md` aparece como **Harlley**, no `resources.md` como **Halley**)

```yaml
name:            "Halley"
description:     "Computing cluster for parallel processing experiments."
descriptionPt:   "Cluster de computação para experimentos de processamento paralelo."
status:          "online"
```

> Convenção sugerida: usar **"Halley"** (grafia correta — cometa de Edmund
> Halley). "Harlley" provavelmente é digitação no slide de apresentação.

## Política de acesso

O acesso aos clusters é **exclusivo** a pesquisadores e estudantes do
LaSDPC. Parcerias com outros laboratórios ou instituições podem ser
consideradas mediante solicitação via formulário de contato. Administradores
respondem com **login e senha temporária**.

Mais detalhes operacionais (solicitar conta, trocar senha) estão em
`../docs/solicitar-conta.md` e `../docs/trocar-senha.md`.

## Financiamento da infraestrutura

> Do arquivo `fnding.md`:
>
> Agradecimentos ao **FAPESP** e ao **CNPq** pelo apoio financeiro na
> construção da infraestrutura.

## Imagens associadas (extraídas em `organizado/imagens/`)

- `assets_icmc_lasdpc_labs.png` — quadro com todos os ativos do laboratório.
- `icmc_lasdpc_lab_1006.png` — planta/visão da sala 1006.
- `icmc_lasdpc_lab_1008.png` — planta/visão da sala 1008.
- `lasdpc_1006_{1,2,3}.jpg` — fotografias da sala 1006.
- `lasdpc_1008_{1,2,3}.jpg` — fotografias da sala 1008.
- `lasdpc_1006_1.jpg` (raiz, ~1,6 MB) — versão de alta resolução.
