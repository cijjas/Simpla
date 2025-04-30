from pydantic import BaseSettings

class Settings(BaseSettings):
    CORS_ORIGINS: list[str] = ["*"]

settings = Settings()