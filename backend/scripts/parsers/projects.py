"""Parser for the 3 project markdown files under `organizado/banco-de-dados/projetos/`.

Each project is parsed individually (low volume, content-rich). The `## Resumo`
YAML block in each markdown gives the metadata; the long-form `content` /
`contentPt` is extracted from the `### English` / `### Português` sections when
present, otherwise rebuilt from the source.
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import Callable, Optional

PROJ_DIR = (
    Path(__file__).resolve().parent.parent.parent.parent
    / "organizado"
    / "banco-de-dados"
    / "projetos"
)

IMG_DIR = (
    Path(__file__).resolve().parent.parent.parent.parent
    / "organizado"
    / "imagens"
    / "About-the-project"
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _extract_yaml_block(text: str, heading: str = "## Resumo") -> dict[str, object]:
    """Extract simple `key: "value"` / `key: [a, b, c]` pairs from the first
    ```yaml block under the given heading. Quotes-aware but not a full YAML
    parser (good enough for our hand-curated files).
    """
    section = text.split(heading, 1)
    if len(section) < 2:
        return {}
    yaml_match = re.search(r"```yaml\s*(.+?)```", section[1], flags=re.DOTALL)
    if not yaml_match:
        return {}
    body = yaml_match.group(1)
    out: dict[str, object] = {}
    # Track multi-line list continuations
    pending_key: Optional[str] = None
    pending_val = ""
    for raw_line in body.splitlines():
        line = raw_line.rstrip()
        if not line.strip():
            continue
        m = re.match(r"^(\w+):\s*(.*)$", line)
        if m:
            if pending_key:
                out[pending_key] = _parse_yaml_value(pending_val)
                pending_key = None
            key, val = m.group(1), m.group(2)
            if val.startswith("[") and not val.rstrip().endswith("]"):
                pending_key = key
                pending_val = val
            else:
                out[key] = _parse_yaml_value(val)
        elif pending_key:
            pending_val += " " + line.strip()
            if line.rstrip().endswith("]"):
                out[pending_key] = _parse_yaml_value(pending_val)
                pending_key = None
    if pending_key:
        out[pending_key] = _parse_yaml_value(pending_val)
    return out


def _parse_yaml_value(raw: str) -> object:
    v = raw.strip()
    if v.startswith("[") and v.endswith("]"):
        items = []
        for piece in v[1:-1].split(","):
            piece = piece.strip().strip('"').strip("'")
            if piece:
                items.append(piece)
        return items
    if (v.startswith('"') and v.endswith('"')) or (
        v.startswith("'") and v.endswith("'")
    ):
        return v[1:-1]
    if v.isdigit():
        return int(v)
    return v


def _extract_content_sections(text: str) -> tuple[str, str]:
    """Pull English/Portuguese narrative from the `### English`/`### Português`
    subsections under `## Conteúdo`. Returns (`content`, `contentPt`) - empty
    strings if absent.
    """
    en_match = re.search(r"### English\s*\n(.*?)(?=### Português|\Z)", text, flags=re.DOTALL)
    pt_match = re.search(r"### Português\s*\n(.*?)(?=## |\Z)", text, flags=re.DOTALL)
    en = (en_match.group(1) if en_match else "").strip()
    pt = (pt_match.group(1) if pt_match else "").strip()
    return en, pt


# ---------------------------------------------------------------------------
# Project parsers
# ---------------------------------------------------------------------------

def parse_smart_lasdpc(image_uploader: Optional[Callable] = None) -> dict:
    text = (PROJ_DIR / "smart-lasdpc.md").read_text(encoding="utf-8")
    meta = _extract_yaml_block(text)
    content_en, content_pt = _extract_content_sections(text)

    image_key: Optional[str] = None
    if image_uploader:
        img_path = IMG_DIR / "smart_lasdpc_architecture_v1.png"
        if img_path.exists():
            image_key = image_uploader(img_path, "projects")

    return {
        "title": meta.get("title", "Smart-LaSDPC"),
        "titlePt": meta.get("titlePt", "Smart-LaSDPC"),
        "description": meta.get(
            "description",
            "First software architecture version for the Smart Building project at LaSDPC/ICMC/USP.",
        ),
        "descriptionPt": meta.get(
            "descriptionPt",
            "Projeto de arquitetura de software para o Smart Building do LaSDPC/ICMC/USP.",
        ),
        "content": content_en,
        "contentPt": content_pt,
        "status": meta.get("status", "active"),
        "tags": meta.get("tags", []),
        "publications": int(meta.get("publications", 5) or 0),
        "impact": meta.get("impact", "High"),
        "image": image_key,
        "gallery": [],
        "website": "https://smart-lasdpc.github.io/",
        "github": "https://github.com/Smart-LaSDPC",
    }


def parse_lasdpc_games(image_uploader: Optional[Callable] = None) -> dict:
    text = (PROJ_DIR / "lasdpc-games.md").read_text(encoding="utf-8")
    meta = _extract_yaml_block(text)

    # Build content from the "Jogos disponíveis" section
    games_section = ""
    m = re.search(r"## Jogos dispon[ií]veis\s*(.+?)(?=## Notas|\Z)", text, flags=re.DOTALL)
    if m:
        games_section = m.group(1).strip()

    content_en = (
        "Open Educational Resources (OER games) produced as a partnership between "
        "ICB/USP and ICMC/USP. The games address physiology, healthy nutrition and "
        "metabolism, with Desktop and Android versions, funded by PRCEU/USP under "
        "the ODS-ONU (2021) call.\n\n"
        "### Available games\n\n"
        "- **Magnatas da Saúde** - a character must recover physical health; teaches "
        "energy metabolism, healthy eating and physical exercise, with their link to "
        "obesity and diabetes.\n"
        "- **Enzigame** - the player controls digestive enzymes, accelerating chemical "
        "reactions and contributing to metabolism.\n"
        "- **Batalha dos Alimentos** - the player shields a character from harmful "
        "foods; teaches food choice with reinforcement questions on nutrition.\n"
        "- **Metabuleiro** - board game with a Metabolism & Obesity quiz, balanced "
        "for competitive group play.\n"
    )
    content_pt = (
        "Recursos Educacionais Abertos (jogos REA) produzidos em parceria entre o "
        "ICB/USP e o ICMC/USP. Os jogos abordam fisiologia, alimentação saudável e "
        "metabolismo, com versões Desktop e Android, com apoio da PRCEU/USP via "
        "edital ODS-ONU (2021).\n\n"
        "### Jogos disponíveis\n\n" + games_section
    )

    return {
        "title": meta.get("title", "LaSDPC Games - Health & Metabolism OERs"),
        "titlePt": meta.get("titlePt", "LaSDPC Games - REA Metabolismo e Obesidade"),
        "description": meta.get("description", ""),
        "descriptionPt": meta.get("descriptionPt", ""),
        "content": content_en,
        "contentPt": content_pt,
        "status": meta.get("status", "active"),
        "tags": meta.get(
            "tags",
            ["OER", "Games", "Health", "ICB/USP", "Educational Computing"],
        ),
        "publications": 0,
        "impact": meta.get("impact", "Medium"),
        "image": None,
        "gallery": [],
        "website": "http://lasdpc.icmc.usp.br/games/",
        "github": "https://github.com/lasdpc-games",
    }


def parse_oer_sistemas_operacionais(image_uploader: Optional[Callable] = None) -> dict:
    text = (PROJ_DIR / "oer-sistemas-operacionais.md").read_text(encoding="utf-8")
    meta = _extract_yaml_block(text)

    # Use the full catalog (markdown table) as content
    catalog_match = re.search(
        r"## Catálogo de OERs dispon[ií]veis\s*(.+?)(?=## Avalia|\Z)",
        text,
        flags=re.DOTALL,
    )
    catalog = catalog_match.group(1).strip() if catalog_match else ""

    overview_en = (
        "41 Open Educational Resources (OER) developed by ICMC/USP students under "
        "the GNU/GPL licence to support the teaching of Operating Systems. The "
        "initiative started in 2015 in three courses coordinated by Prof. Paulo "
        "Sérgio Lopes de Souza:\n\n"
        "- **SSC0640 – Operating Systems I** (Computer Engineering, undergraduate) - 14 OERs.\n"
        "- **SSC5723 – Operating System** (PPG-CCMC, graduate) - 5 OERs.\n"
        "- **SSC0140 – Operating Systems** (2nd semester 2015) - remaining OERs.\n\n"
        "Faculty collaborators: Ellen Francine Barbosa, Sarita Mazzini Bruschi and "
        "Júlio Cézar Estrella, with students Douglas Rondon (monitor), Liuri Loami, "
        "Felipe Brunelli de Andrade and Danilo Marins Costa Segura.\n\n"
        "### Evaluation results\n\n"
        "- 773 assessments collected (632 from students, 141 from teachers).\n"
        "- 96.4% of students and 90.8% of teachers rated the OERs at least as \"Good\".\n"
        "- Average rating: 9.0 (students), 8.4 (teachers).\n\n"
        "### Catalogue\n\n" + catalog
    )

    overview_pt = (
        "41 Recursos Educacionais Abertos (REA) desenvolvidos por alunos do ICMC/USP "
        "sob licença GNU/GPL para apoiar o ensino de Sistemas Operacionais. A "
        "iniciativa começou em 2015 em três disciplinas coordenadas pelo "
        "Prof. Paulo Sérgio Lopes de Souza:\n\n"
        "- **SSC0640 – Sistemas Operacionais I** (Engenharia de Computação, graduação) - 14 REAs.\n"
        "- **SSC5723 – Sistemas Operacionais** (PPG-CCMC, pós-graduação) - 5 REAs.\n"
        "- **SSC0140 – Sistemas Operacionais** (2º semestre 2015) - demais REAs.\n\n"
        "Colaboração: Ellen Francine Barbosa, Sarita Mazzini Bruschi e "
        "Júlio Cézar Estrella, com os alunos Douglas Rondon (monitor), Liuri Loami, "
        "Felipe Brunelli de Andrade e Danilo Marins Costa Segura.\n\n"
        "### Avaliações\n\n"
        "- 773 avaliações realizadas (632 por alunos, 141 por professores).\n"
        "- 96,4% dos alunos e 90,8% dos professores classificaram os REAs como, no mínimo, \"Boas\".\n"
        "- Nota média: 9,0 (alunos), 8,4 (professores).\n\n"
        "### Catálogo\n\n" + catalog
    )

    return {
        "title": meta.get(
            "title", "OER - Open Educational Resources for Operating Systems"
        ),
        "titlePt": meta.get(
            "titlePt",
            "REA - Recursos Educacionais Abertos para Sistemas Operacionais",
        ),
        "description": meta.get(
            "description",
            "41 Open Educational Resources developed by ICMC/USP students under GNU/GPL to support the teaching of Operating Systems.",
        ),
        "descriptionPt": meta.get(
            "descriptionPt",
            "41 Recursos Educacionais Abertos (REA) desenvolvidos por alunos do ICMC/USP sob licença GNU/GPL para o ensino de Sistemas Operacionais.",
        ),
        "content": overview_en,
        "contentPt": overview_pt,
        "status": meta.get("status", "active"),
        "tags": meta.get(
            "tags",
            ["Open Educational Resources", "Operating Systems", "GNU/GPL", "Educational Computing"],
        ),
        "publications": 0,
        "impact": meta.get("impact", "Medium"),
        "image": None,
        "gallery": [],
        "website": None,
        "github": None,
    }


def parse_all(image_uploader: Optional[Callable] = None) -> list[dict]:
    return [
        parse_smart_lasdpc(image_uploader),
        parse_lasdpc_games(image_uploader),
        parse_oer_sistemas_operacionais(image_uploader),
    ]
