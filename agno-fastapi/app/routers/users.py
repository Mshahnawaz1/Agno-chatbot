import sqlite3

from fastapi import APIRouter, HTTPException, status

from app import db
from app.deps import CurrentUser
from app.schemas import UserCreate, UserOut
from app.security import hash_password

router = APIRouter(prefix="/users", tags=["users"])


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def signup(body: UserCreate):
    """Create an account. Returns the user, not a token: log in at /auth/token.
    body.email is already normalized by the schema.
    """
    try:
        return db.create_user(body.email, body.name, hash_password(body.password))
    except sqlite3.IntegrityError:
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser):
    return user
