# Frontend — Página Pesquisa / Research

> **Destino:** `frontend/src/pages/ResearchPage.tsx` + i18n.
> **Fonte:** `research.md`.

## Cabeçalho

### `header_en`
> Our research activities take place in an academic and enjoyable
> environment, drawing on our infrastructure. The research developed by
> LaSDPC is dynamic and changes according to the distributed-computing
> evolution.

### `header_pt`
> Nossas atividades de pesquisa acontecem em um ambiente acadêmico
> agradável, apoiadas pela nossa infraestrutura. A pesquisa desenvolvida no
> LaSDPC é dinâmica e evolui acompanhando a computação distribuída.

## Linhas de pesquisa

> Linhas em que o LaSDPC tem trabalhado recentemente.

### 1. Performance Evaluation — Avaliação de Desempenho

- Simulation, prototyping and benchmark — *Simulação, prototipação e benchmark*
- Load indices for web services — *Índices de carga para web services*
- Mobile computing — *Computação móvel*
- Green computing — *Computação verde*

### 2. High Performance Computing — Computação de Alto Desempenho

- Development of high-performance applications — *Desenvolvimento de aplicações de alto desempenho*
- Testing of distributed and parallel applications — *Teste de aplicações distribuídas e paralelas*
- Process scheduling — *Escalonamento de processos*

### 3. Distributed Systems — Sistemas Distribuídos

- Grid and Cloud computing — *Computação em grade e em nuvem*
- Service-oriented architecture (SOA) — *Arquitetura orientada a serviços*
- QoS — *Qualidade de serviço*
- Web services — *Web services*

### 4. Free Software / Open Source — Software Livre / Código Aberto

- Techniques and methodologies for open-software development — *Técnicas e metodologias para desenvolvimento de software aberto*
- Open Educational Resources (OER) — *Recursos Educacionais Abertos (REA)*

### 5. Computer Networks — Redes de Computadores

- Security in computer networks — *Segurança em redes de computadores*
- Protocols — *Protocolos*
- Middlewares for Flying Ad-Hoc Networks — *Middlewares para FANETs*
- Ubiquitous Computing and Internet of Things (IoT) — *Computação ubíqua e Internet das Coisas (IoT)*

### 6. Adaptive Computer Systems — Sistemas Computacionais Adaptativos

- Dynamic modelling of computational systems — *Modelagem dinâmica de sistemas computacionais*
- Computational simulation of natural systems — *Simulação computacional de sistemas naturais*
- Real-time self-management and optimization — *Auto-gestão e otimização em tempo real*

## Estrutura sugerida para i18n

```json
{
  "research": {
    "header": "...",
    "headerPt": "...",
    "lines": [
      { "title": "Performance Evaluation", "titlePt": "Avaliação de Desempenho",
        "topics": ["Simulation, prototyping and benchmark", "..."],
        "topicsPt": ["Simulação, prototipação e benchmark", "..."] },
      ...
    ]
  }
}
```
