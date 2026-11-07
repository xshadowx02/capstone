from pydantic_settings import BaseSettings
from pathlib import Path
import os
from typing import Optional

_PACKAGE = Path(__file__).resolve().parent

class Settings(BaseSettings):

    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "")
    database_url: str = os.getenv("DATABASE_URL", f"postgresql+asyncpg://postgres:{POSTGRES_PASSWORD}@localhost:5432/postgres")
    qdrant_host: str = os.getenv("QDRANT_URL", "localhost")
    qdrant_port: int = int(os.getenv("QDRANT_PORT", "6333"))
    qdrant_collection: str = os.getenv("QDRANT_COLLECTION", "ledger_categories")

    openrouter_base_url: str = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
    openrouter_api_key: str = os.getenv("OPEN_ROUTER_API_KEY", "")

    ollama_host: str = os.getenv("OLLAMA_HOST", "http://host.docker.internal:11434")
    
    chat_model: str =  os.getenv("CHAT_MODEL", "gemma4:e2b")
    embed_model: str = os.getenv("EMBEDDING_MODEL", "embeddinggemma:latest")

    llm_backend: str = os.getenv("LLM_BACKEND", "ollama")

    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
