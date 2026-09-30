from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from bson import ObjectId
from fastapi import HTTPException
from pydantic import ValidationError

from core.dependencies import get_current_user
from core.security import create_access_token, verify_password
from models.user import AdminPasswordUpdate
from routers.users import set_user_password


def user(email: str = "member@example.com") -> dict:
    return {"_id": ObjectId(), "email": email, "name": "Member", "initials": "MM", "role": "aluno_ativo", "is_admin": False}


@pytest.mark.asyncio
async def test_admin_reset_hashes_password_and_revokes_existing_sessions():
    admin = user("admin@example.com")
    target = user()
    db = MagicMock()
    db.users.find_one = AsyncMock(return_value=target)
    db.users.update_one = AsyncMock()
    old_token = create_access_token({"sub": target["email"], "ver": 0})

    with patch("routers.users.get_db", return_value=db):
        await set_user_password(str(target["_id"]), AdminPasswordUpdate(new_password="correct-horse-battery-42"), admin)

    update = db.users.update_one.await_args.args[1]
    assert verify_password("correct-horse-battery-42", update["$set"]["hashed_password"])
    assert update["$inc"] == {"auth_version": 1}
    assert "correct-horse-battery-42" not in str(update)

    target["auth_version"] = 1
    with patch("core.dependencies.get_db", return_value=db):
        with pytest.raises(HTTPException) as error:
            await get_current_user(old_token)
    assert error.value.status_code == 401


@pytest.mark.asyncio
async def test_admin_cannot_reset_own_password_or_bootstrap_password():
    admin = user("admin@example.com")
    with pytest.raises(HTTPException) as own_error:
        await set_user_password(str(admin["_id"]), AdminPasswordUpdate(new_password="long-password-123"), admin)
    assert own_error.value.status_code == 400

    target = user("root@example.com")
    db = MagicMock()
    db.users.find_one = AsyncMock(return_value=target)
    db.users.update_one = AsyncMock()
    with patch("routers.users.get_db", return_value=db), patch("routers.users.settings.admin_email", "root@example.com"):
        with pytest.raises(HTTPException) as bootstrap_error:
            await set_user_password(str(target["_id"]), AdminPasswordUpdate(new_password="long-password-123"), admin)
    assert bootstrap_error.value.status_code == 409
    db.users.update_one.assert_not_awaited()


@pytest.mark.asyncio
async def test_password_length_is_validated_before_update():
    with pytest.raises(ValidationError):
        AdminPasswordUpdate(new_password="too-short")

    admin = user("admin@example.com")
    target = user()
    with pytest.raises(HTTPException) as error:
        await set_user_password(str(target["_id"]), AdminPasswordUpdate(new_password="é" * 40), admin)
    assert error.value.status_code == 400
