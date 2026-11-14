"""
pip install -r requirements.txt
uvicorn app.main:app --reload          # run from the agno-fastapi/ root
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

from app import db
from app.routers import auth, sessions, users, chat, connectors
from app.connectors import tools as connector_tools

from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates


# uvicorn configures only its own loggers; show ours (run costs, routing, tool calls) too.
_handler = logging.StreamHandler()
_handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(name)s: %(message)s", "%H:%M:%S"))
logging.getLogger("app").addHandler(_handler)
logging.getLogger("app").setLevel(logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_db()  # create tables on startup
    yield
    await connector_tools.close_all()  # close open MCP connections


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
app.include_router(connectors.router)


@app.get("/health")
def health():
    return {"status": "ok"}

# must be registered last: a mount at "/" matches every path
app.mount("/", StaticFiles(directory="frontend", html=True), name="static")

