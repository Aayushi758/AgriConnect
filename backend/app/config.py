"""KisanSetu Configuration - loads settings from environment variables."""
import json
from pathlib import Path
from typing import List, Optional
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database
    DATABASE_URL: str = "sqlite:///./kisansetu.db"
    
    # JWT
    JWT_SECRET_KEY: str = "dev-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    # LLM Provider
    LLM_PROVIDER: str = "mock"
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    
    # Weather Provider
    WEATHER_PROVIDER: str = "mock"
    OPENWEATHER_API_KEY: Optional[str] = None
    
    # Routing Provider
    ROUTING_PROVIDER: str = "mock"
    OSRM_BASE_URL: str = "http://router.project-osrm.org"
    
    # Payment Provider
    PAYMENT_PROVIDER: str = "mock"
    
    # File Upload
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 10
    
    # CORS
    CORS_ORIGINS: str = '["http://localhost:5173","http://localhost:3000"]'
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    
    @property
    def cors_origins_list(self) -> List[str]:
        try:
            return json.loads(self.CORS_ORIGINS)
        except (json.JSONDecodeError, TypeError):
            return ["http://localhost:5173", "http://localhost:3000"]
    
    @property
    def upload_path(self) -> Path:
        path = Path(self.UPLOAD_DIR)
        path.mkdir(parents=True, exist_ok=True)
        return path
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
