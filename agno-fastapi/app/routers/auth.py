from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app import db
from app.schemas import Token, normalize_email
from app.security import create_access_token, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/token", response_model=Token)
def login(form: Annotated[OAuth2PasswordRequestForm, Depends()]):
    """OAuth2 password flow: form fields `username` (our email) and `password`.
    Form-encoded, not JSON, because that's what the OAuth2 spec and Swagger's
    Authorize button send.
    """
    user = db.get_user_by_email(normalize_email(form.username))
    # verify_password still hashes when user is None, so timing is the same either way
    if not verify_password(form.password, user["password_hash"] if user else None):
        # Same message for "no such email" and "wrong password"
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return Token(access_token=create_access_token(user["id"]))
