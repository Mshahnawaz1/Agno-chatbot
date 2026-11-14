from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_db_path: str = "data/app.db"
    agno_db_path: str = "data/agno.db"
    tool_cache_ttl: int = 3600 #seconds
    tool_cache_dir: str = "data/tools"

    # LLMs: Groq first; Gemini takes over when Groq rate-limits (free tier: 8k
    # tokens/min) or fails. No GEMINI_API_KEY = no fallback.
    groq_model: str = "openai/gpt-oss-120b"
    # Tried in order. Availability varies: on 2026-11-14 gemini-3.6/3.7/3.8-flash
    # were overloaded (503/504) and 2.5-flash is closed to new keys.
    gemini_models: str = "gemini-3.5-flash-lite,gemini-3.5-flash"
    gemini_timeout: float = 30  # seconds per attempt, so an overloaded model fails over
    gemini_api_key: str = ""

    # Auth. No default for the secret: the app refuses to start without one.
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 60

    # Connectors
    app_name: str = "Agno FastAPI"  # shown on providers' consent screens
    public_url: str = "http://localhost:8000"  # base of OAuth callback URLs
    connector_secret: str  # Fernet key that encrypts stored tokens; no default

settings = Settings()