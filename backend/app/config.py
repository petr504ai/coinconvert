from pydantic_settings import BaseSettings
from pathlib import Path

env_file = Path(__file__).parent.parent.parent / ".env"

class Settings(BaseSettings):
    database_url: str = "sqlite:///./coinconvert.db"
    secret_key: str = "your-secret-key-here"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Tron Network Settings (using TronGrid public API)
    trongrid_api_key: str = ""
    usdt_trc20_contract: str = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"
    master_wallet_address: str = ""
    master_wallet_private_key: str = ""
    
    class Config:
        env_file = env_file
        env_file_encoding = 'utf-8'
        case_sensitive = False

settings = Settings()