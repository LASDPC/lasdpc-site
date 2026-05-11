"""Parsers for the 6 markdown files under `organizado/banco-de-dados/pessoas/`.

Each parser returns a list of dicts shaped to match `UserCreate` in
`backend/models/user.py`. The seed orchestrator then upserts them into the
`users` collection.
"""

from __future__ import annotations

import re
import unicodedata
from pathlib import Path

PESSOAS_DIR = (
    Path(__file__).resolve().parent.parent.parent.parent
    / "organizado"
    / "banco-de-dados"
    / "pessoas"
)


# ---------------------------------------------------------------------------
# Docente registry — emails verified manually (markdown lists "sim" but no URL)
# ---------------------------------------------------------------------------
# Maps the docente full name (as written in corpo-docente.md) to a canonical
# email and the enrichment data the markdown alone does not carry. Anything
# beyond `email` is best-effort and can be edited via the admin UI later.

_DOCENTE_REGISTRY: dict[str, dict] = {
    "Francisco José Monaco": {
        "email": "monaco@icmc.usp.br",
        "title": "Associate Professor",
        "titlePt": "Professor Associado",
        "area": "Operating Systems, Distributed Systems, Computer Engineering",
        "areaPt": "Sistemas Operacionais, Sistemas Distribuídos, Engenharia de Computação",
        "lattes": "http://lattes.cnpq.br/9981851760470819",
        "page": "https://www.icmc.usp.br/pessoas/monaco",
        "year_joined": 2003,
    },
    "Júlio Cezar Estrella": {
        "email": "jcezar@icmc.usp.br",
        "title": "Associate Professor",
        "titlePt": "Professor Associado",
        "area": "Service-Oriented Architectures, Cloud Computing, Distributed Systems",
        "areaPt": "Arquiteturas Orientadas a Serviço, Computação em Nuvem, Sistemas Distribuídos",
        "lattes": "http://lattes.cnpq.br/5433967267727516",
        "page": "https://cemeai.icmc.usp.br/julio-cezar-estrella/",
        "year_joined": 2010,
    },
    "Marcos José Santana": {
        "email": "mjs@icmc.usp.br",
        "title": "Full Professor",
        "titlePt": "Professor Titular",
        "area": "Distributed Systems, Performance Evaluation, Cloud Computing",
        "areaPt": "Sistemas Distribuídos, Avaliação de Desempenho, Computação em Nuvem",
        "lattes": "http://lattes.cnpq.br/4807879341312515",
        "page": "https://www.icmc.usp.br/pessoas/marcos-santana",
        "year_joined": 1992,
    },
    "Paulo Sérgio Lopes de Souza": {
        "email": "pssouza@icmc.usp.br",
        "title": "Associate Professor",
        "titlePt": "Professor Associado",
        "area": "High-Performance Computing, Process Scheduling, Concurrent Programming",
        "areaPt": "Computação de Alto Desempenho, Escalonamento de Processos, Programação Concorrente",
        "lattes": "http://lattes.cnpq.br/4254001833729264",
        "page": "https://sites.icmc.usp.br/pssouza/",
        "year_joined": 2005,
    },
    "Regina Helena Carlucci Santana": {
        "email": "rcs@icmc.usp.br",
        "title": "Full Professor",
        "titlePt": "Professora Titular",
        "area": "Distributed Systems, Cloud Computing, Performance Evaluation",
        "areaPt": "Sistemas Distribuídos, Computação em Nuvem, Avaliação de Desempenho",
        "lattes": "http://lattes.cnpq.br/3447180372254515",
        "page": "https://www.icmc.usp.br/pessoas/regina-santana",
        "year_joined": 1992,
    },
    "Sarita Mazzini Bruschi": {
        "email": "sarita@icmc.usp.br",
        "title": "Associate Professor",
        "titlePt": "Professora Doutora",
        "area": "Computer Systems, Operating Systems, Distributed Systems",
        "areaPt": "Sistemas de Computação, Sistemas Operacionais, Sistemas Distribuídos",
        "lattes": "http://lattes.cnpq.br/4283383074438575",
        "page": "https://www.icmc.usp.br/pessoas/sarita",
        "year_joined": 2004,
    },
}


# ---------------------------------------------------------------------------
# Advisor name normalisation
# ---------------------------------------------------------------------------
# The markdown shorthand for advisors ("Paulo S. L. de Souza", "Sarita M.
# Bruschi", "RCS", "Monaco / Regina") needs to map back to the docente's full
# name so we can resolve advisor_id via lookup after docentes are inserted.

_ADVISOR_ALIASES: dict[str, str] = {
    "Paulo S. L. de Souza": "Paulo Sérgio Lopes de Souza",
    "Paulo Souza": "Paulo Sérgio Lopes de Souza",
    "Paulo": "Paulo Sérgio Lopes de Souza",
    "Júlio C. Estrella": "Júlio Cezar Estrella",
    "Julio C. Estrella": "Júlio Cezar Estrella",
    "Julio Cezar Estrella": "Júlio Cezar Estrella",
    "Júlio Cezar Estrella": "Júlio Cezar Estrella",
    "Sarita M. Bruschi": "Sarita Mazzini Bruschi",
    "Sarita Bruschi": "Sarita Mazzini Bruschi",
    "Sarita": "Sarita Mazzini Bruschi",
    "Marcos J. Santana": "Marcos José Santana",
    "Marcos": "Marcos José Santana",
    "Regina H. C. Santana": "Regina Helena Carlucci Santana",
    "Regina": "Regina Helena Carlucci Santana",
    "RCS": "Regina Helena Carlucci Santana",
    "Francisco J. Monaco": "Francisco José Monaco",
    "Monaco": "Francisco José Monaco",
}


def _normalize_advisor(raw: str) -> list[str]:
    """Resolve an advisor cell (possibly with multiple names) to canonical names.

    Examples:
        "Paulo S. L. de Souza" -> ["Paulo Sérgio Lopes de Souza"]
        "Monaco / Regina"      -> ["Francisco José Monaco", "Regina Helena Carlucci Santana"]
        "Jó Ueyama"            -> ["Jó Ueyama"]   (not in registry, returned as-is)
    """
    if not raw or raw.strip() in {"—", "-", ""}:
        return []
    parts = re.split(r"\s*/\s*", raw.strip())
    out: list[str] = []
    for p in parts:
        out.append(_ADVISOR_ALIASES.get(p.strip(), p.strip()))
    return out


# ---------------------------------------------------------------------------
# Email helpers
# ---------------------------------------------------------------------------

def _slugify(name: str) -> str:
    s = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode("ascii")
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s


def _synth_email(name: str, suffix: str) -> str:
    return f"{_slugify(name)}@{suffix}"


def _initials(name: str) -> str:
    parts = [p for p in name.strip().split() if p]
    if len(parts) >= 2:
        return (parts[0][0] + parts[-1][0]).upper()
    return name[:2].upper() if name else "??"


# ---------------------------------------------------------------------------
# Markdown table parser
# ---------------------------------------------------------------------------

def _parse_markdown_table(text: str) -> list[list[str]]:
    """Return list of row-cells for every markdown table row found in `text`.

    Skips the header row, separator row (---), and lines outside tables.
    """
    rows: list[list[str]] = []
    in_table = False
    seen_separator = False
    for raw_line in text.splitlines():
        line = raw_line.rstrip()
        if not line.startswith("|"):
            in_table = False
            seen_separator = False
            continue
        if not in_table:
            in_table = True
            seen_separator = False
            continue
        cells = [c.strip() for c in line.strip("|").split("|")]
        if not seen_separator:
            if all(re.match(r":?-+:?$", c) for c in cells if c):
                seen_separator = True
                continue
            # No separator yet — treat as another header to skip
            continue
        rows.append(cells)
    return rows


# ---------------------------------------------------------------------------
# Public parsers
# ---------------------------------------------------------------------------

def parse_docentes() -> list[dict]:
    """Return one dict per faculty member, ready to insert into `users`."""
    md = (PESSOAS_DIR / "corpo-docente.md").read_text(encoding="utf-8")
    rows = _parse_markdown_table(md)
    docs: list[dict] = []
    for row in rows:
        if not row or not row[0]:
            continue
        name = row[0]
        registry = _DOCENTE_REGISTRY.get(name)
        if not registry:
            print(f"[!] docente sem registro de email: {name} — usando email sintético")
            registry = {"email": _synth_email(name, "icmc.usp.br")}
        doc = {
            "email": registry["email"],
            "name": name,
            "role": "docente",
            "initials": _initials(name),
            "status": "active",
            "title": registry.get("title"),
            "titlePt": registry.get("titlePt"),
            "area": registry.get("area"),
            "areaPt": registry.get("areaPt"),
            "lattes": registry.get("lattes"),
            "page": registry.get("page"),
            "year_joined": registry.get("year_joined"),
            "research_areas": registry.get("research_areas"),
        }
        # Drop None values so admin UI shows empty fields cleanly
        docs.append({k: v for k, v in doc.items() if v is not None})
    return docs


def _parse_student_table(
    md_path: Path,
    level: str,
    level_pt: str,
    role: str = "aluno_ativo",
) -> list[dict]:
    md = md_path.read_text(encoding="utf-8")
    rows = _parse_markdown_table(md)
    out: list[dict] = []
    for row in rows:
        if not row or not row[0]:
            continue
        name = row[0]
        advisors = _normalize_advisor(row[1]) if len(row) > 1 else []
        advisor_name = advisors[0] if advisors else None
        out.append(
            {
                "email": _synth_email(name, "alumni.lasdpc.usp.br")
                if role == "alumni"
                else _synth_email(name, "lasdpc.usp.br"),
                "name": name,
                "role": role,
                "initials": _initials(name),
                "status": "active",
                "level": level,
                "levelPt": level_pt,
                "advisor_name": advisor_name,
                "year_joined": 2016 if role == "aluno_ativo" else None,
            }
        )
    return out


def parse_doutorandos() -> list[dict]:
    return _parse_student_table(
        PESSOAS_DIR / "doutorandos.md", "PhD", "Doutorado"
    )


def parse_mestrandos() -> list[dict]:
    return _parse_student_table(
        PESSOAS_DIR / "mestrandos.md", "MSc", "Mestrado"
    )


def parse_graduandos() -> list[dict]:
    return _parse_student_table(
        PESSOAS_DIR / "graduandos-iniciacao.md",
        "Iniciação Científica",
        "Iniciação Científica",
    )


def parse_alumni() -> list[dict]:
    """Parse `alumni.md` — 172 alumni rows.

    Column order: # | Aluno | Ano(s) | Orientador(es) | Nível
    """
    md = (PESSOAS_DIR / "alumni.md").read_text(encoding="utf-8")
    rows = _parse_markdown_table(md)
    level_map = {
        "PhD": ("PhD", "Doutorado"),
        "MSc": ("MSc", "Mestrado"),
        "SI": ("Iniciação Científica", "Iniciação Científica"),
        "Post-Doc": ("Post-Doc", "Pós-Doutorado"),
    }
    out: list[dict] = []
    for row in rows:
        if len(row) < 5:
            continue
        _idx, name, years_raw, advisors_raw, levels_raw = row[:5]
        if not name:
            continue
        years = [y.strip() for y in re.split(r"\s*/\s*", years_raw) if y.strip()]
        levels = [lv.strip() for lv in re.split(r"\s*/\s*", levels_raw) if lv.strip()]
        advisors = _normalize_advisor(advisors_raw)

        graduation_year: int | None = None
        if years:
            try:
                graduation_year = int(years[-1])
            except ValueError:
                graduation_year = None

        last_level = levels[-1] if levels else ""
        level, level_pt = level_map.get(last_level, (last_level or None, None))

        # Build a bilingual bio when the person had earlier programs
        bio_en = ""
        bio_pt = ""
        if len(years) > 1 and len(levels) >= 1:
            steps_en = []
            steps_pt = []
            for y, lv in zip(years, levels):
                lv_en, lv_pt = level_map.get(lv, (lv, lv))
                steps_en.append(f"{lv_en} in {y}")
                steps_pt.append(f"{lv_pt} em {y}")
            bio_en = "LaSDPC alumnus — " + ", ".join(steps_en) + "."
            bio_pt = "Egresso(a) do LaSDPC — " + ", ".join(steps_pt) + "."

        out.append(
            {
                "email": _synth_email(name, "alumni.lasdpc.usp.br"),
                "name": name,
                "role": "alumni",
                "initials": _initials(name),
                "status": "active",
                "level": level,
                "levelPt": level_pt,
                "advisor_name": advisors[0] if advisors else None,
                "graduation_year": graduation_year,
                "year_joined": int(years[0]) if years and years[0].isdigit() else None,
                "bio": bio_en or None,
                "bioPt": bio_pt or None,
            }
        )
    return out


def parse_smart_lasdpc_researchers() -> list[dict]:
    md = (PESSOAS_DIR / "smart-lasdpc-pesquisadores.md").read_text(encoding="utf-8")
    # The file has two tables: current and past researchers.
    sections = md.split("## Pesquisadores anteriores")
    current_md = sections[0]
    past_md = sections[1] if len(sections) > 1 else ""

    program_level = {
        "Doctoral Student": ("PhD", "Doutorado"),
        "Master's Student": ("MSc", "Mestrado"),
        "Final course work": ("TCC", "TCC"),
        "Scientific initiation": ("Iniciação Científica", "Iniciação Científica"),
    }

    def _parse(text: str, role: str) -> list[dict]:
        rows = _parse_markdown_table(text)
        out: list[dict] = []
        for row in rows:
            if len(row) < 3 or not row[0]:
                continue
            name = row[0]
            program = row[1]
            period = row[2]
            linkedin = row[3] if len(row) > 3 else ""

            level, level_pt = program_level.get(program, (program, program))

            year_joined: int | None = None
            graduation_year: int | None = None
            m_start = re.search(r"(\d{4})", period)
            if m_start:
                year_joined = int(m_start.group(1))
            if role == "alumni":
                years = re.findall(r"(\d{4})", period)
                if years:
                    graduation_year = int(years[-1])

            doc = {
                "email": _synth_email(name, "smart.lasdpc.usp.br"),
                "name": name,
                "role": role,
                "initials": _initials(name),
                "status": "active",
                "level": level,
                "levelPt": level_pt,
                "advisor_name": "Júlio Cezar Estrella",
                "year_joined": year_joined,
                "graduation_year": graduation_year,
                "research_areas": [
                    "Smart Building",
                    "IoT",
                    "Reactive Architecture",
                ],
            }
            if linkedin and linkedin.startswith("http") and linkedin.rstrip("/") != "https://www.linkedin.com":
                doc["linkedin"] = linkedin
            out.append(doc)
        return out

    return _parse(current_md, "aluno_ativo") + _parse(past_md, "alumni")


def parse_all_students() -> list[dict]:
    """Parse the 2016 active-student snapshots (PhD/MSc/Undergrad)."""
    return parse_doutorandos() + parse_mestrandos() + parse_graduandos()


def parse_everyone() -> tuple[list[dict], list[dict]]:
    """Return (docentes, others) where `others` already excludes anyone whose
    name appears in `docentes` (deduplicates Sarita/Paulo/Julio who are in alumni
    table but currently faculty).
    """
    docentes = parse_docentes()
    docente_names = {d["name"] for d in docentes}

    others = parse_all_students() + parse_smart_lasdpc_researchers() + parse_alumni()
    deduped: list[dict] = []
    seen_emails: set[str] = set()
    for person in others:
        if person["name"] in docente_names:
            continue
        if person["email"] in seen_emails:
            continue
        seen_emails.add(person["email"])
        deduped.append(person)
    return docentes, deduped
