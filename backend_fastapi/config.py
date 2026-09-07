from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    gemini_api_key: str = ''
    gemini_model: str = 'gemini-3.8-flash'
    environment: str = 'development'
    cors_origins: str = '*'
    port: int = 8000
    host: str = '0.0.0.0'

    class Config:
        env_file = '.env'
        env_file_encoding = 'utf-8'
        env_prefix = ''
        extra = 'ignore'


@lru_cache
def get_settings() -> Settings:
    return Settings()
