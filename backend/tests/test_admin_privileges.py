from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from bson import ObjectId
from fastapi import HTTPException

from models.user import AdminPrivilegeUpdate, UserUpdate
from routers.users import delete_user, set_admin_privilege, update_user


def make_user(*, is_admin: bool = False, status: str = "active", email: str = "member@example.com") -> dict:
    return {
        "_id": ObjectId(),
        "email": email,
        "name": "Lab Member",
        "initials": "LM",
        "role": "aluno_ativo",
        "status": status,
        "is_admin": is_admin,
    }


@pytest.mark.asyncio
async def test_admin_can_grant_and_revoke_another_active_user():
    admin = make_user(is_admin=True, email="admin@example.com")
    target = make_user()
    db = MagicMock()
    db.users.find_one = AsyncMock(side_effect=[target, target])
    db.users.update_one = AsyncMock()
    db.users.count_documents = AsyncMock(return_value=2)

    with patch("routers.users.get_db", return_value=db):
        granted = await set_admin_privilege(str(target["_id"]), AdminPrivilegeUpdate(is_admin=True), admin)
        revoked = await set_admin_privilege(str(target["_id"]), AdminPrivilegeUpdate(is_admin=False), admin)

    assert granted.is_admin is True
    assert revoked.is_admin is False
    assert db.users.update_one.await_count == 2
    assert db.users.update_one.await_args_list[0].args[1] == {"$set": {"is_admin": True}}
    assert db.users.update_one.await_args_list[1].args[1] == {"$set": {"is_admin": False}}


@pytest.mark.asyncio
async def test_admin_cannot_change_own_privilege():
    admin = make_user(is_admin=True)
    with pytest.raises(HTTPException) as error:
        await set_admin_privilege(str(admin["_id"]), AdminPrivilegeUpdate(is_admin=False), admin)
    assert error.value.status_code == 400


@pytest.mark.asyncio
async def test_pending_user_cannot_be_promoted():
    admin = make_user(is_admin=True)
    target = make_user(status="pending")
    db = MagicMock()
    db.users.find_one = AsyncMock(return_value=target)
    db.users.update_one = AsyncMock()
    with patch("routers.users.get_db", return_value=db):
        with pytest.raises(HTTPException) as error:
            await set_admin_privilege(str(target["_id"]), AdminPrivilegeUpdate(is_admin=True), admin)
    assert error.value.status_code == 400
    db.users.update_one.assert_not_awaited()


@pytest.mark.asyncio
async def test_bootstrap_admin_cannot_be_demoted():
    admin = make_user(is_admin=True)
    target = make_user(is_admin=True, email="root@example.com")
    db = MagicMock()
    db.users.find_one = AsyncMock(return_value=target)
    db.users.update_one = AsyncMock()
    with patch("routers.users.get_db", return_value=db), patch("routers.users.settings.admin_email", "root@example.com"):
        with pytest.raises(HTTPException) as error:
            await set_admin_privilege(str(target["_id"]), AdminPrivilegeUpdate(is_admin=False), admin)
    assert error.value.status_code == 409
    db.users.update_one.assert_not_awaited()


@pytest.mark.asyncio
async def test_last_admin_cannot_be_demoted():
    admin = make_user(is_admin=True)
    target = make_user(is_admin=True)
    db = MagicMock()
    db.users.find_one = AsyncMock(return_value=target)
    db.users.count_documents = AsyncMock(return_value=1)
    db.users.update_one = AsyncMock()
    with patch("routers.users.get_db", return_value=db), patch("routers.users.settings.admin_email", ""):
        with pytest.raises(HTTPException) as error:
            await set_admin_privilege(str(target["_id"]), AdminPrivilegeUpdate(is_admin=False), admin)
    assert error.value.status_code == 409
    db.users.update_one.assert_not_awaited()


@pytest.mark.asyncio
async def test_generic_profile_update_cannot_change_admin_privilege():
    admin = make_user(is_admin=True)
    target = make_user()
    db = MagicMock()
    db.users.update_one = AsyncMock()
    with patch("routers.users.get_db", return_value=db):
        with pytest.raises(HTTPException) as error:
            await update_user(str(target["_id"]), UserUpdate(is_admin=True), admin)
    assert error.value.status_code == 400
    db.users.update_one.assert_not_awaited()


@pytest.mark.asyncio
async def test_admin_cannot_delete_own_account():
    admin = make_user(is_admin=True)
    with pytest.raises(HTTPException) as error:
        await delete_user(str(admin["_id"]), admin)
    assert error.value.status_code == 400


@pytest.mark.asyncio
async def test_admin_cannot_delete_bootstrap_account():
    admin = make_user(is_admin=True)
    target = make_user(is_admin=True, email="root@example.com")
    db = MagicMock()
    db.users.find_one = AsyncMock(return_value=target)
    db.users.delete_one = AsyncMock()
    with patch("routers.users.get_db", return_value=db), patch("routers.users.settings.admin_email", "root@example.com"):
        with pytest.raises(HTTPException) as error:
            await delete_user(str(target["_id"]), admin)
    assert error.value.status_code == 409
    db.users.delete_one.assert_not_awaited()
