import sqlite3

from fastapi import APIRouter, HTTPException, status

from app import db
from app.deps import CurrentUser
from app.schemas import UserCreate, UserOut

router = APIRouter(prefix="/users", tags=["users"])


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def signup(body: UserCreate):
    """Simulated signup: no password, just creates a row and returns the id."""
    try:
        return db.create_user(body.email, body.name)
    except sqlite3.IntegrityError:
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser):
    return user