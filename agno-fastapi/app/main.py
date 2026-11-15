"""
pip install -r requirements.txt
uvicorn app.main:app --reload          # run from the agno-fastapi/ root
"""

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException

from app import db
from app.routers import auth, sessions, users, chat, connectors
from app.connectors import tools as connector_tools

logger = logging.getLogger("app")

API_PREFIXES = {"auth", "users", "sessions", "chat", "connectors", "health"}
DIST_DIR = Path(__file__).resolve().parent.parent / "frontend" / "dist"


class SPAStaticFiles(StaticFiles):
    """Serve the React build; unknown non-API paths fall back to index.html."""

    @staticmethod
    def _is_spa_path(path: str) -> bool:
        parts = path.strip("/").split("/")
        # API paths and missing files (e.g. /assets/x.js) keep their 404.
        return parts[0] not in API_PREFIXES and "." not in parts[-1]

    async def get_response(self, path, scope):
        try:
            response = await super().get_response(path, scope)
        except StarletteHTTPException as exc:
            if exc.status_code != 404 or not self._is_spa_path(path):
                raise
            return await super().get_response("index.html", scope)
        if response.status_code == 404 and self._is_spa_path(path):
            return await super().get_response("index.html", scope)
        return response


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
if DIST_DIR.is_dir():
    app.mount("/", SPAStaticFiles(directory=DIST_DIR, html=True), name="static")
else:
    logger.warning(
        "frontend/dist not found; run `cd frontend && npm install && npm run build`"
    )

