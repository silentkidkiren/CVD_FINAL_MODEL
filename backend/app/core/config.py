from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama3-8b-8192"
    FL_SERVER_HOST: str = "localhost"
    FL_SERVER_PORT: int = 8080
    ENVIRONMENT: str = "development"

    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://ideal-space-giggle-jjj9q4969w4vcpwpq-5173.app.github.dev"
    ]

    class Config:
        env_file = ".env"

settings = Settings()