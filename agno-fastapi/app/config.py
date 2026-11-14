from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_db_path: str = "data/app.db"
    agno_db_path: str = "data/agno.db"
    tool_cache_ttl: int = 3600 #seconds
    tool_cache_dir: str = "data/tools"

    # Auth. No default for the secret: the app refuses to start without one.
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 60

    # Connectors
    app_name: str = "Agno FastAPI"  # shown on providers' consent screens
    public_url: str = "http://localhost:8000"  # base of OAuth callback URLs
    connector_secret: str  # Fernet key that encrypts stored tokens; no default

settings = Settings()