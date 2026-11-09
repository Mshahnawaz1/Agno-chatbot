from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_db_path: str = "data/app.db"
    agno_db_path: str = "data/agno.db"
    tool_cache_ttl: int = 3600 #seconds
    tool_cache_dir: str = "data/tools"


settings = Settings()