"""Parser for `organizado/banco-de-dados/infraestrutura/clusters-e-equipamentos.md`.

Extracts the 3 clusters (Cosmos, Andromeda, Halley) and their associated images
from the `organizado/imagens/About-the-project/` folder. The "Harlley" typo from
the original `info.md` is normalised to "Halley".
"""

from __future__ import annotations

from pathlib import Path
from typing import Callable, Optional

INFRA_FILE = (
    Path(__file__).resolve().parent.parent.parent.parent
    / "organizado"
    / "banco-de-dados"
    / "infraestrutura"
    / "clusters-e-equipamentos.md"
)

IMG_DIR = (
    Path(__file__).resolve().parent.parent.parent.parent
    / "organizado"
    / "imagens"
    / "About-the-project"
)


_DATA_CENTER_BLURB_EN = (
    "\n\n**Physical room:** {room}. "
    "{room_description}"
)

_COSMOS_CONTEXT_EN = (
    "High-performance cluster used by LaSDPC researchers and students for "
    "parallel computing experiments. Hosted in **Room 1006**, the primary data "
    "center: 24 computers and a temperature-controlled server room with five "
    "air-conditioning units (three inside the datacenter, two external)."
)
_COSMOS_CONTEXT_PT = (
    "Cluster de alto desempenho usado por pesquisadores e estudantes do LaSDPC "
    "para experimentos de computação paralela. Localizado na **Sala 1006**, o "
    "datacenter principal: 24 computadores e uma sala climatizada com cinco "
    "aparelhos de ar-condicionado (três dentro do datacenter e dois externos)."
)

_ANDROMEDA_CONTEXT_EN = (
    "Cluster dedicated to LaSDPC research and partner laboratories. Hosted in "
    "**Room 1008**, the secondary data center: 5 computers, two large monitors, "
    "double air-conditioning, and a coexisting student/faculty lounge "
    "(fridge, kettle, coffee machine)."
)
_ANDROMEDA_CONTEXT_PT = (
    "Cluster dedicado às pesquisas do LaSDPC e laboratórios parceiros. "
    "Localizado na **Sala 1008**, o datacenter secundário: 5 computadores, "
    "dois monitores grandes, ar-condicionado duplo, e que também funciona como "
    "sala de convivência para alunos e professores (geladeira, chaleira, "
    "máquina de café)."
)

_HALLEY_CONTEXT_EN = (
    "Computing cluster for parallel processing experiments. Part of LaSDPC's "
    "computing infrastructure (80 computers, 3 clusters, 4 firewalls, 3 storage "
    "appliances), funded with support from **FAPESP** and **CNPq**."
)
_HALLEY_CONTEXT_PT = (
    "Cluster de computação para experimentos de processamento paralelo. Faz "
    "parte da infraestrutura computacional do LaSDPC (80 computadores, 3 "
    "clusters, 4 firewalls, 3 storages), com apoio da **FAPESP** e do **CNPq**."
)


def parse_all(image_uploader: Optional[Callable] = None) -> list[dict]:
    """Return the 3 cluster documents, with images uploaded if uploader given."""

    def _upload(filename: str) -> Optional[str]:
        if not image_uploader:
            return None
        path = IMG_DIR / filename
        if not path.exists():
            print(f"[!] imagem não encontrada: {path}")
            return None
        return image_uploader(path, "clusters")

    cosmos_img = _upload("lasdpc_1006_1.jpg")
    cosmos_gallery = [
        key
        for key in (
            _upload("lasdpc_1006_2.jpg"),
            _upload("lasdpc_1006_3.jpg"),
            _upload("icmc_lasdpc_lab_1006.png"),
        )
        if key
    ]

    andromeda_img = _upload("lasdpc_1008_1.jpg")
    andromeda_gallery = [
        key
        for key in (
            _upload("lasdpc_1008_2.jpg"),
            _upload("lasdpc_1008_3.jpg"),
            _upload("icmc_lasdpc_lab_1008.png"),
        )
        if key
    ]

    halley_img = _upload("assets_icmc_lasdpc_labs.png")

    return [
        {
            "name": "Cosmos",
            "description": _COSMOS_CONTEXT_EN,
            "descriptionPt": _COSMOS_CONTEXT_PT,
            "cpuUsage": 0,
            "gpuUsage": 0,
            "memoryUsage": 0,
            "storageUsage": 0,
            "status": "online",
            "custom_fields": [
                {
                    "name": "password_change_url",
                    "label": "Change password",
                    "labelPt": "Trocar senha",
                    "type": "text",
                    "options": [],
                    "required": False,
                }
            ],
            "image": cosmos_img,
            "gallery": cosmos_gallery,
        },
        {
            "name": "Andromeda",
            "description": _ANDROMEDA_CONTEXT_EN,
            "descriptionPt": _ANDROMEDA_CONTEXT_PT,
            "cpuUsage": 0,
            "gpuUsage": 0,
            "memoryUsage": 0,
            "storageUsage": 0,
            "status": "online",
            "custom_fields": [],
            "image": andromeda_img,
            "gallery": andromeda_gallery,
        },
        {
            "name": "Halley",
            "description": _HALLEY_CONTEXT_EN,
            "descriptionPt": _HALLEY_CONTEXT_PT,
            "cpuUsage": 0,
            "gpuUsage": 0,
            "memoryUsage": 0,
            "storageUsage": 0,
            "status": "online",
            "custom_fields": [],
            "image": halley_img,
            "gallery": [],
        },
    ]
