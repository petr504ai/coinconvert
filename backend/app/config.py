from pydantic_settings import BaseSettings
from pathlib import Path

# .env file is in the backend folder, not project root
env_file = Path(__file__).parent.parent / ".env"

class Settings(BaseSettings):
    database_url: str = "sqlite:///./coinconvert.db"
    secret_key: str = "your-secret-key-here"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Tron Network Settings (using TronGrid public API)
    trongrid_api_key: str = ""
    tron_pro_api_key: str = ""  # Same as trongrid_api_key, for tronpy library
    usdt_trc20_contract: str = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"
    master_wallet_address: str = ""
    master_wallet_private_key: str = ""
    
    # API Rate Limiting & Retry Settings
    max_retries: int = 3
    retry_delay: float = 2.0  # seconds
    retry_on_rate_limit: bool = True
    
    # Pricing Settings
    buy_margin: float = 0.05  # 5% markup when user buys from us
    sell_margin: float = 0.03  # 3% discount when user sells to us
    exchange_rate_cache_minutes: int = 5  # Cache exchange rate for 5 minutes
    
    # Rate Limiting
    api_retry_attempts: int = 3
    api_retry_delay: int = 2  # seconds
    api_request_delay: float = 0.5  # delay between requests in seconds
    
    class Config:
        env_file = env_file
        env_file_encoding = 'utf-8'
        case_sensitive = False

settings = Settings()