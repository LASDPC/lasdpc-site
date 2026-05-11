# Frontend — Página Contato

> **Destino:** `frontend/src/pages/ContactPage.tsx` + i18n.
> **Fontes:** `home.md`, `info.md`, `Contact us - Smart LaSDPC.html`.

## Endereço institucional (versão clássica)

```yaml
institution_en: "University of São Paulo — Institute of Mathematics and Computer Sciences (ICMC)"
institution_pt: "Universidade de São Paulo — Instituto de Ciências Matemáticas e de Computação (ICMC)"
phone:          "+55 (16) 3373-9564"
address_line1:  "Rua Doutor Carlos de Camargo Salles, 395"
address_line2:  "Bloco 1, Sala 1-006"
cep:            "13560-550"
city:           "São Carlos"
state:          "SP"
country:        "Brazil"
```

## Endereço institucional (versão Smart-LaSDPC, mais recente)

> Fonte: `Contact us - Smart LaSDPC.html`. Conflita parcialmente com a versão
> clássica (CEP diferente — provável endereço atualizado).

```yaml
institution_en: "Universidade de São Paulo — Instituto de Ciências Matemáticas e de Computação"
address_line1:  "Avenida Trabalhador São-carlense, 400"
neighborhood:   "Centro"
cep_main:       "13566-590"
cep_block1:     "13560-550"   # bloco 1 / sala 1-006
city:           "São Carlos"
state:          "SP"
country:        "Brazil"
phone:          "+55 (16) 3373-9564"
room:           "Bloco 1, Sala 1-006"
email_contact:  "herminiopaucar@usp.br"   # mantido para o projeto Smart-LaSDPC
```

> **Sugestão:** o site atual deve usar a **Avenida Trabalhador São-carlense,
> 400** (endereço institucional oficial do ICMC) e manter "Bloco 1, Sala
> 1-006" como complemento. A "Rua Doutor Carlos de Camargo Salles, 395" do
> arquivo antigo parece ser o endereço alternativo.

## Coordenadas geográficas

Do script Leaflet do site Smart-LaSDPC:

```yaml
latitude:   -22.00741
longitude:  -47.89533
zoom:       15
popup:      "ICMC, Block 1, rooms 1006 and 1008."
```

## Redes sociais e canais

```yaml
facebook:   "https://www.facebook.com/lasdpc.icmc"
github_old: "https://github.com/lasdpc-games"
github_new: "https://github.com/Smart-LaSDPC"
```

## Estrutura sugerida para i18n

```json
{
  "contact": {
    "title": "Contact",
    "titlePt": "Contato",
    "address": { "en": "...", "pt": "..." },
    "phone": "+55 (16) 3373-9564",
    "email": "lasdpc@icmc.usp.br",   // confirmar — não estava no site antigo
    "map": { "lat": -22.00741, "lng": -47.89533, "zoom": 15 }
  }
}
```
