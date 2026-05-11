"""Parsers for the 2 markdown files under `organizado/banco-de-dados/publicacoes/`.

- `publicacoes-smart-lasdpc.md`: 5 entries in structured bullet format.
- `publicacoes-1988-2014.md`: ~350 entries in scriptLattes bibliographic format,
  grouped by year section. We use a regex-based state machine and fall back to
  writing the raw entry into `title` when parsing fails — nothing is lost.
"""

from __future__ import annotations

import re
from pathlib import Path

PUBS_DIR = (
    Path(__file__).resolve().parent.parent.parent.parent
    / "organizado"
    / "banco-de-dados"
    / "publicacoes"
)


# ---------------------------------------------------------------------------
# Smart-LaSDPC (2023-2024)
# ---------------------------------------------------------------------------

def parse_smart_lasdpc() -> list[dict]:
    text = (PUBS_DIR / "publicacoes-smart-lasdpc.md").read_text(encoding="utf-8")
    if "## Mapeamento" in text:
        text = text.split("## Mapeamento")[0]

    out: list[dict] = []
    current_year: int | None = None
    current: dict | None = None

    def _flush():
        nonlocal current
        if current:
            out.append(current)
        current = None

    for raw in text.splitlines():
        line = raw.rstrip()
        ymatch = re.match(r"^## (\d{4})\s*$", line)
        if ymatch:
            _flush()
            current_year = int(ymatch.group(1))
            continue
        entry_match = re.match(r"^\s*\d+\.\s+\*\*(.+?)\*\*\s*$", line)
        if entry_match:
            _flush()
            current = {
                "title": entry_match.group(1).strip(),
                "titlePt": "",
                "authors": "",
                "venue": "",
                "year": current_year or 0,
                "doi": "",
            }
            continue
        if current is None:
            continue
        stripped = line.strip()
        if stripped.startswith("- Autores:"):
            current["authors"] = stripped.split(":", 1)[1].strip()
        elif stripped.startswith("- Venue:"):
            current["venue"] = stripped.split(":", 1)[1].strip()
        elif stripped.startswith("- DOI:"):
            current["doi"] = stripped.split(":", 1)[1].strip()
    _flush()
    return out


# ---------------------------------------------------------------------------
# Historical 1988-2014
# ---------------------------------------------------------------------------

# An entry typically looks like:
#   "<AUTHORS_CAPS>. <Title>. Em: <Venue>, p. ..., 2014."
#   "<AUTHORS_CAPS>. <Title>. <Journal>. v. X, p. Y, issn: ..., 2014."
# After the first "AUTHORS. " segment, the title runs until the next ". " that
# precedes "Em:" or a clearly journal-shaped phrase. We split on ". " and walk.

_YEAR_LINE = re.compile(r"^\s*(\d{4})\s*$")
_ENTRY_LINE = re.compile(r"^\s*\d+\.\s+(.+?)\s*$")
_END_MARKERS = ("*itens sem ano", "*Sem ano declarado", "---", "> *Data de processamento")


def _split_entry(text: str) -> tuple[str, str, str]:
    """Best-effort extraction of (authors, title, venue) from one bibliographic line.

    Authors are the leading run of UPPER/INITIAL tokens separated by ` ; `,
    ending at the first `..` (double-period). Then the title runs up to the
    next `. Em: ` or `. <Journal-like>` boundary.
    """
    # The original lines often end with "AUTHORS.. " (double period); collapse.
    line = text.replace(" ..", "..")

    # Authors block: up to first ".." (double) OR ". " followed by a non-caps token.
    m_auth = re.match(r"^(.+?)\.\.\s+", line)
    if m_auth:
        authors = m_auth.group(1).strip()
        rest = line[m_auth.end():]
    else:
        # Fallback: split on first ". " where left side looks author-y (mostly caps)
        m_auth = re.match(r"^([A-ZÀ-Ý][^.]+?(?:\s*;\s*[A-ZÀ-Ý][^.]+?)*)\.\s+", line)
        if m_auth:
            authors = m_auth.group(1).strip()
            rest = line[m_auth.end():]
        else:
            return "", line.strip(), ""

    # Title runs until the next ". Em:" or next ". " followed by something venue-like.
    # Simplest heuristic: take everything up to ". Em:" if present; otherwise up to
    # the next ". " that's followed by a capital letter and a long phrase.
    m_em = re.search(r"\.\s+Em:\s*", rest)
    if m_em:
        title = rest[: m_em.start()].strip()
        venue_raw = rest[m_em.end():].strip()
    else:
        # Take title up to first ". " (period+space)
        parts = re.split(r"\.\s+", rest, maxsplit=1)
        title = parts[0].strip()
        venue_raw = parts[1].strip() if len(parts) > 1 else ""

    # Venue: trim trailing ", year." and ", p. X-Y" pieces.
    venue = re.split(r",\s*p\.|,\s*\d{4}\.|\.\s*$", venue_raw, maxsplit=1)[0].strip()
    venue = venue.rstrip(",. ")

    return authors, title, venue


def parse_historical() -> list[dict]:
    text = (PUBS_DIR / "publicacoes-1988-2014.md").read_text(encoding="utf-8")
    out: list[dict] = []
    current_year: int | None = None
    in_entries = False
    for raw_line in text.splitlines():
        line = raw_line.rstrip()
        if any(marker in line for marker in _END_MARKERS):
            current_year = None
            continue
        if not line.strip():
            continue
        m_year = _YEAR_LINE.match(line)
        if m_year:
            y = int(m_year.group(1))
            if 1988 <= y <= 2014:
                current_year = y
                in_entries = True
                continue
        m_entry = _ENTRY_LINE.match(line)
        if not (in_entries and m_entry and current_year):
            continue
        body = m_entry.group(1)
        # Strip trailing year if it's "..., 2014." duplicated; we already know it
        body = re.sub(r"\s*$", "", body)
        authors, title, venue = _split_entry(body)
        doi_match = re.search(r"10\.\d{4,9}/[^\s,;]+", body)
        doi = doi_match.group(0) if doi_match else ""

        if not title:
            # Last resort: keep raw line so nothing is lost
            title = body

        out.append(
            {
                "title": title,
                "titlePt": "",
                "authors": authors,
                "venue": venue,
                "year": current_year,
                "doi": doi,
            }
        )
    return out


def parse_all() -> list[dict]:
    return parse_smart_lasdpc() + parse_historical()
