"""
pip install -r requirements.txt
uvicorn app.main:app --reload          # run from the agno-fastapi/ root
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

from app import db
from app.routers import auth, sessions, users, chat

from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates


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
    allow_headers=["*"],   # covers Authorization
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(sessions.router)
app.include_router(chat.router)


@app.get("/health")
def health():
    return {"status": "ok"}

# must be registered last: a mount at "/" matches every path
app.mount("/", StaticFiles(directory="frontend", html=True), name="static")

