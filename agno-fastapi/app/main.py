"""
pip install -r requirements.txt
uvicorn app.main:app --reload          # run from the agno-fastapi/ root
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI

from app import db
from app.routers import sessions, users, chat

from fastapi.middleware.cors import CORSMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_db()  # create tables on startup
    yield


app = FastAPI(title="Agno + FastAPI", lifespan=lifespan)

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    # allow_origins=["http://localhost:8080"],
    allow_origins= ["*"],
    allow_methods=["*"],
    allow_headers=["*"],   # covers X-User-Id
)

app.include_router(users.router)
app.include_router(sessions.router)
app.include_router(chat.router)


@app.get("/health")
def health():
    return {"status": "ok"}

