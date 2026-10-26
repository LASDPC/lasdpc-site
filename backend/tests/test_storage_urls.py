from core.config import settings
from core.storage import public_url


def test_public_url_uses_public_base_without_duplicating_bucket(monkeypatch):
    monkeypatch.setattr(settings, "minio_bucket", "lasdpc-media")
    monkeypatch.setattr(settings, "minio_public_url", "https://lasdpc.icmc.usp.br/media///")
    assert public_url("profile/photo.png") == "https://lasdpc.icmc.usp.br/media/profile/photo.png"
    assert public_url("/lasdpc-media/lasdpc-media/profile/photo.png") == "https://lasdpc.icmc.usp.br/media/profile/photo.png"
