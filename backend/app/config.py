from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    confidence_threshold: float = 0.6
    debug: bool = True

    class Config:
        env_file = ".env"

settings = Settings()