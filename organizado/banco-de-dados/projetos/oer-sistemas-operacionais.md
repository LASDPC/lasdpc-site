# OER - Recursos Educacionais Abertos para Sistemas Operacionais

> **Destino:** coleção `projects` (cada OER pode virar **um project** ou um
> único project com array - sugestão: criar **um** project "OER Operating
> Systems" e armazenar os 41 recursos numa coleção dedicada ou em
> `tags`/`content`).
> **Modelo:** `backend/models/project.py :: ProjectCreate`
> **Fonte:** `computing in education/educationresouces.md`

## Resumo

```yaml
title:        "OER - Open Educational Resources for Operating Systems"
titlePt:      "REA - Recursos Educacionais Abertos para Sistemas Operacionais"
description:  "41 Open Educational Resources developed by ICMC/USP students under GNU/GPL to support the teaching of Operating Systems."
descriptionPt: "41 Recursos Educacionais Abertos (REA) desenvolvidos por alunos do ICMC/USP sob licença GNU/GPL para o ensino de Sistemas Operacionais."
status:       "active"
tags:         ["Open Educational Resources", "Operating Systems",
               "GNU/GPL", "Educational Computing"]
impact:       "Medium"
```

## Visão geral

A proposta surgiu em 2015 nas disciplinas de Sistemas Operacionais
ministradas pelo **Prof. Paulo Sérgio Lopes de Souza** no ICMC/USP:

- **SSC0640 – Operating Systems I** (Engenharia de Computação, graduação) -
  14 OERs.
- **SSC5723 – Operating System** (PPG-CCMC, pós-graduação) - 5 OERs.
- **SSC0140** (Sistemas Operacionais, 2º semestre 2015) - demais OERs.

Colaboraram também as professoras **Ellen Francine Barbosa**,
**Sarita Mazzini Bruschi** e o **Prof. Júlio Cézar Estrella**, além dos
alunos **Douglas Rondon** (monitor), **Liuri Loami**, **Felipe Brunelli de
Andrade** e **Danilo Marins Costa Segura**.

## Catálogo de OERs disponíveis

Cada item segue o padrão `<#> – <Nome> (<Turma>)`. Os campos `Disponível`,
`Plataforma` e `Idiomas` foram preservados do arquivo original.

| # | OER | Turma | Plataforma | Idiomas | Equipe |
|---|-----|-------|------------|---------|--------|
| 01 | Logical Backup Simulator        | EC15  | Web     | EN, PT     | Fernando T. Pacheco; Gustavo Okuda; João P. J. Candido; Lucas J. Clarim |
| 02 | Hashi – Dining Philosophers     | EC15  | Web     | EN, PT     | Alunos SSC0640 |
| 03 | Omega Network 1                 | EC15  | Web     | EN, PT, ES | Bernardo C. Rodrigues; Guilherme Gonçalves; João P. G. Codognotto; Rafael M. de Freitas |
| 04 | MEEG (Semaphores, Mutexes, Producer-Consumer) | EC15 | Desktop | EN, PT | Denilson A. Marques Jr.; Elisa J. Marcatto; Lucas Tomazela; Victor M. Nunes |
| 05 | Memory Fragmentation            | EC15  | Web     | EN, PT     | Leonardo B. Prates; Marlon J. Francisco; Mateus R. Vanzella; Vitor B. da Silva |
| 06 | I/O Methods                     | EC15  | Web     | EN, PT     | Guilherme C. de Oliveira; Jessica B. Aissa; Leonardo C. P. e Silva; Lucas T. Munhoz |
| 07 | Mnemônico – Message Passing     | EC15  | Desktop | EN, PT     | Cassiano Z. de Oliveira; Lucas M. Rovere; Luiz M. Votto; Vitor M. A. Lima |
| 08 | Omega Network 2                 | EC15  | Desktop | EN, PT, FR | Henrique P. Grando; Igor Q. Mendes; João V. A. de Aguiar; Moisés B. F. Silva |
| 09 | RAID                            | EC15  | Web     | EN, PT, ES | Giuliano B. Prado; Victor P. Silvano; Adson F. V. da Silva |
| 10 | Disk Arm Scheduling             | EC15  | Web     | EN, PT     | Leandro L. Bellini; Pedro H. Fini; Rafael M. de Olinda; Tiago V. Tapparo |
| 11 | Banker's Algorithm              | EC15  | Web     | EN, PT     | Caio C. A. Guimarães; Henrique C. M. de Souza Aranha; Lucas E. C. de Mello |
| 12 | Page Replacement NRU/FIFO/2nd-Clock | EC15 | Desktop | EN, PT  | Gyordano G. Reis; Lucas H. F. Leal; Renan Y. Kawamura |
| 13 | Critical Region                 | EC15  | Desktop | EN, PT     | Guilherme N. Fortes; Henrique A. M. da Silveira; Marcello P. F. Costa; Sergio Y. Takeda |
| 14 | Sleeping Barber Problem         | EC15  | Web     | EN         | Klaus Borges |
| 15 | FunOS (Process Wars / Need for CPU Speed) | Pos15 | Web | EN, PT | Luiz C. Querino Filho; Leonardo B. Estácio |
| 16 | BASOPER (Batch Simulator)       | Pos15 | Web     | EN, PT, ES | Henrique Y. Shishido; Leonildo J. M. de Azevedo |
| 17 | I3S (Interactive Systems Scheduling Simulator) | Pos15 | Web | EN, PT | Maria L. Fioravanti; Marcelo K. Kamada |
| 18 | Dinner of Soccer Players (Philosophers) | Pos15 | Web | EN, PT | Iohan G. Vargas; Thadeu A. F. de Melo; Guilherme F. Ribeiro |
| 19 | Fork, Wait and Exec Simulator   | Pos15 | Web     | EN, PT, ES | Carlos A. O. de Souza Jr.; Rafael R. dos Santos |
| 20 | Operating Systems Records       | SSC0140 | Web   | EN, PT     | Thiago Tanaka; Bruno Fabbri; Frederico Sampaio; Aulos Plautius |
| 21 | Precise Interrupts              | SSC0140 | Web   | PT         | Ana C. Spengler; Paulo B. N. Nascimento; Laís H. Chiachio; Renato S. Goto |
| 22 | Process State                   | SSC0140 | Web   | EN, PT     | Roni C. de Castro; Raul Z. Rosa; Luan G. Orlandi; Henrique P. Santos |
| 23 | SysSheeps (Clone syscall)       | SSC0140 | Web   | EN, PT     | Gustavo Santiago; Lucas Albertine; Marcos Junqueira; Henrique Freitas |
| 24 | LRU Simulator                   | SSC0140 | Web   | EN, PT     | Alyson Maruyama; Ariella Brambila; Márcio Campos |
| 25 | Disk Formatting                 | SSC0140 | Web   | EN, PT     | Guilherme Zanardo; Danilo Nery; Lucas Moura; Gustavo Ceccon |
| 26 | Paging and Segmentation         | SSC0140 | Web   | EN, PT     | Fúlvio E. Ferreira; João V. Guimarães; Rafael M. Lopes; Willian G. de Oliveira |
| 27 | FAT File System                 | SSC0140 | Web   | EN, PT     | Carlos A. Schneider Jr.; Frederico de A. Marques; Lucas K. Crocomo; Roberto P. Alegro |
| 28 | Deadlock Modelling              | SSC0140 | Web   | EN, PT     | Victor H. Heclis; Victor A. M. Saia; Nilson F. da Silva |
| 29 | Linux Scheduling (O(1))         | SSC0140 | Web   | EN, PT     | Rafael Marques; Julia M. Macias; Gabriel L. F. Souto |
| 30 | System Calls                    | SSC0140 | Web   | EN, PT     | Daniel C. França; Gabriel S. Bicalho; Lucas A. de Castro |
| 31 | Sleep–Wakeup Simulator          | SSC0140 | Web   | EN, PT     | Rodrigo Weigert; Rita Raad; Matheus Cabrini |
| 32 | Buddy Algorithm                 | SSC0140 | Web   | EN, PT     | Carlos E. A. Fialho; Isadora M. M. de Souza |
| 33 | Stable Storage                  | SSC0140 | Web   | EN, PT     | Gabriel C. Cristiano; Gustavo D. Cavalheri; Leonardo Ventura |
| 34 | Peterson's Algorithm            | SSC0140 | Web   | EN, PT     | Lucas M. Gasparino; Rogiel dos Santos Silva; Tiago de M. Leite |
| 35 | Space Sharing Schedule          | SSC0140 | Web   | EN, PT     | Arnaldo L. Stanzani; Guilherme Gonçalves; Guilherme S. dos Anjos; Pedro R. Rocha |
| 36 | Boot System                     | SSC0140 | Web   | EN, PT     | Luis R. G. da Silva; Otávio A. F. Sousa; Rafael K. Nissi; Victor M. Dário |
| 37 | Create & Join (POSIX threads)   | SSC0140 | Web   | PT, EN, JA | Adriller G. Ferreira; Allan R. Polachini; Hikaro A. de Oliveira; Leonardo C. Cerqueira |
| 38 | Working Set                     | SSC0140 | Web   | PT, EN     | Augusto de P. Freitas; Gustavo B. Paixão; Lucas S. Loureiro |
| 39 | X Window System                 | SSC0140 | Web   | PT, EN     | Danilo Tedeschi; Laercio de Oliveira Jr.; Luiz Miyazaki |
| 40 | Threads Implementation          | SSC0140 | Web   | PT, EN     | Giovanni Robira; Luis P. F. Justino; Rafael Biffi Neto |
| 41 | CFS Algorithm Simulation        | SSC0140 | Web   | PT, EN     | William N. R. França; Ana C. K. Ferreira; Lucas de C. R. da Silva |

> Várias OERs aparecem na lista marcadas como *"must be available soon"*:
> Threads User vs Kernel, LINUX Syscall Clone, pthread_create & pthread_join,
> Peterson's Solution, LINUX O(1), LINUX CFS, Paging x Segmentation,
> Formatting, X-Window, Space Sharing, Types of Multiprocessor OS. Algumas
> dessas correspondem a OERs concluídas mais tarde (ver itens 21–41).

## Avaliações (informativo)

- 773 avaliações realizadas, sendo **632** por alunos e **141** por
  professores.
- 96,4% dos alunos e 90,8% dos professores classificaram as REAs como, no
  mínimo, "Boas".
- Nota média: 9,0 (alunos), 8,4 (professores).
- Critérios: Relevância para o ensino; Aderência aos objetivos; Interface;
  Uso em sala; Uso extraclasse; Processo de instalação.

## Notas

- Licença: GNU/GPL.
- Coordenação: Prof. Paulo Sérgio Lopes de Souza - LaSDPC/SSC/ICMC/USP.
- Há um conjunto separado de jogos do projeto **Metabolismo e Obesidade**
  (ICB/USP × ICMC/USP) - modelados em `lasdpc-games.md`.
