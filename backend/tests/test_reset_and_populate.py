import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

from routers.stats import _count_researchers
from scripts.reset_and_populate import clear_bucket, load_docs, prepare_content


def test_seed_content_is_valid_and_has_only_one_student():
    data = prepare_content()
    assert [person["name"] for person in data["students"]] == ["Luiz Felipe Diniz Costa"]
    assert data["students"][0]["year_joined"] == 2024
    assert len(data["publications"]) == 2
    assert len(data["blog_posts"]) == 2
    assert len(load_docs()) == 8
    assert all(doc["path"].endswith(".md") for doc in data["docs"])


def test_bucket_cleanup_removes_versions_and_current_objects():
    class FakeS3:
        def __init__(self):
            self.versions = [{"Key": "old.jpg", "VersionId": "v1"}]
            self.markers = [{"Key": "old.jpg", "VersionId": "v2"}]
            self.current = [{"Key": "new.jpg"}]
            self.deleted = []

        def list_object_versions(self, **_kwargs):
            return {"Versions": self.versions[:], "DeleteMarkers": self.markers[:]}

        def list_objects_v2(self, **_kwargs):
            return {"Contents": self.current[:]}

        def delete_objects(self, **kwargs):
            objects = kwargs["Delete"]["Objects"]
            self.deleted.extend(objects)
            for obj in objects:
                if "VersionId" in obj:
                    self.versions = [item for item in self.versions if item != obj]
                    self.markers = [item for item in self.markers if item != obj]
                else:
                    self.current = [item for item in self.current if item != obj]
            return {}

    fake = FakeS3()
    with patch("scripts.reset_and_populate._s3", fake):
        assert clear_bucket() == 3
    assert fake.deleted == [
        {"Key": "old.jpg", "VersionId": "v1"},
        {"Key": "old.jpg", "VersionId": "v2"},
        {"Key": "new.jpg"},
    ]


def test_researcher_count_excludes_technical_admin():
    db = MagicMock()
    db.users.count_documents = AsyncMock(side_effect=[6, 1])
    assert asyncio.run(_count_researchers(db)) == 7
    assert db.users.count_documents.await_args_list[0].args[0]["is_admin"] == {"$ne": True}
    assert db.users.count_documents.await_args_list[1].args[0]["is_admin"] == {"$ne": True}
