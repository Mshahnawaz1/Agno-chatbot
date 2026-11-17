from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]  # dots-in-chat/


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_db_path: str = "data/app.db"
    agno_db_path: str = "data/agno.db"
    tool_cache_ttl: int = 3600 #seconds
    tool_cache_dir: str = "data/tools"

    agent_workspace: Path = ROOT / "data" / "workspace"  # absolute: same folder whatever the working dir

    primary_model: str = "gemini"
    groq_model: str = "openai/gpt-oss-120b"
    groq_timeout: float = 20  # seconds; a stalled Groq call fails over instead of hanging

    gemini_models: str = "gemini-3.5-flash-lite,gemini-3.5-flash"
    gemini_timeout: float = 30  # seconds per attempt, so an overloaded model fails over
    gemini_api_key: str = ""
    gemini_thinking_level: str = "low"

    # Auth. No default for the secret: the app refuses to start without one.
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 600

    # Connectors
    app_name: str = "Dots-in Chat"  # shown on providers' consent screens
    public_url: str = "http://localhost:8000"  # base of OAuth callback URLs
    connector_secret: str  # Fernet key that encrypts stored tokens; no default

settings = Settings()