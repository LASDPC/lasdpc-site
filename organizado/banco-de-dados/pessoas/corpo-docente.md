# Corpo Docente (Faculty)

> **Destino:** coleção `users` - `role: "docente"`
> **Modelo:** `backend/models/user.py :: UserCreate`
> **Fonte:** `people/team.md` (2016) + `info.md`

Os links de Lattes/ResearchGate vieram listados no arquivo original mas sem
URL - precisam ser revalidados antes do seed. Os títulos abreviados estão
em `info.md`; ajustar `title`/`titlePt` conforme padrão atual.

| Nome | Título original (info.md) | Lattes | ResearchGate |
|---|---|---|---|
| Francisco José Monaco        | Prof. Dr. em Engenharia Elétrica | sim | sim |
| Júlio Cezar Estrella         | Prof. Dr. em Ciência da Computação | sim | sim |
| Marcos José Santana          | - | sim | - |
| Paulo Sérgio Lopes de Souza  | Prof. Dr. em Física Aplicada (Física Computacional) | sim | sim |
| Regina Helena Carlucci Santana | - | sim | sim |
| Sarita Mazzini Bruschi       | Profa. Dra. em Ciência da Computação | sim | sim |

## Sugestão de mapeamento p/ `UserCreate`

```yaml
role: "docente"
status: "active"
name: <Nome completo>
title: "Full Professor"      # ajustar
titlePt: "Professor(a) Titular"
area: "Distributed Systems"  # ajustar por docente
lattes: "https://lattes.cnpq.br/..."
researchgate: "https://www.researchgate.net/profile/..."
```
