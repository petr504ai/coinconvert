from tronpy import Tron
from tronpy.keys import PrivateKey
from decimal import Decimal
from ..config import settings
import logging
import time
import os
from functools import wraps

logger = logging.getLogger(__name__)

def retry_on_rate_limit(func):
    """Decorator to retry on rate limit errors with exponential backoff"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        if not settings.retry_on_rate_limit:
            return func(*args, **kwargs)
        
        for attempt in range(settings.max_retries):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                if '429' in str(e) and attempt < settings.max_retries - 1:
                    wait_time = settings.retry_delay * (2 ** attempt)
                    logger.warning(f"Rate limited in {func.__name__}, retrying in {wait_time}s (attempt {attempt + 1}/{settings.max_retries})...")
                    time.sleep(wait_time)
                else:
                    raise
        return func(*args, **kwargs)
    return wrapper

class TronWallet:
    def __init__(self):
        # Connect to TronGrid API with proper configuration
        logger.info(f"Initializing TronWallet for mainnet")
        
        try:
            # Set API key as environment variable for tronpy
            if settings.trongrid_api_key:
                os.environ['TRON_PRO_API_KEY'] = settings.trongrid_api_key
                logger.info(f"Using TronGrid API with key (starting with: {settings.trongrid_api_key[:10]}...)")
            else:
                logger.warning("No TronGrid API key configured. Using free tier (rate limited). Set TRONGRID_API_KEY in .env")
            
            self.client = Tron(network='mainnet')
            
            # USDT TRC-20 contract
            logger.info(f"Loading USDT contract: {settings.usdt_trc20_contract}")
            self.usdt_contract = self._get_contract_with_retry(settings.usdt_trc20_contract)
            logger.info("USDT contract loaded successfully")
        except Exception as e:
            logger.error(f"Failed to initialize USDT contract: {e}")
            self.usdt_contract = None
    
    def _get_contract_with_retry(self, address):
        """Get contract with retry logic for rate limiting"""
        for attempt in range(settings.max_retries):
            try:
                return self.client.get_contract(address)
            except Exception as e:
                if '429' in str(e) and attempt < settings.max_retries - 1:
                    wait_time = settings.retry_delay * (2 ** attempt)
                    logger.warning(f"Rate limited during contract init, retrying in {wait_time}s (attempt {attempt + 1}/{settings.max_retries})...")
                    time.sleep(wait_time)
                else:
                    if '429' in str(e):
                        logger.error(f"Rate limit exceeded after {settings.max_retries} retries. Please wait a few minutes or add TRONGRID_API_KEY to .env")
                    raise
    
    def generate_deposit_address(self):
        """Generate a new Tron address for deposits"""
        private_key = PrivateKey.random()
        address = private_key.public_key.to_base58check_address()
        return {
            'address': address,
            'private_key': private_key.hex()
        }
    
    @retry_on_rate_limit
    def get_usdt_balance(self, address: str) -> Decimal:
        """Get USDT balance for an address"""
        if not self.usdt_contract:
            logger.error("USDT contract not initialized")
            return Decimal(0)
        
        try:
            balance = self.usdt_contract.functions.balanceOf(address)
            # USDT has 6 decimals on Tron
            return Decimal(balance) / Decimal(10**6)
        except Exception as e:
            logger.error(f"Error getting balance for {address}: {e}")
            return Decimal(0)
    
    @retry_on_rate_limit
    def check_incoming_transaction(self, address: str, expected_amount: Decimal) -> dict:
        """Check if address received expected USDT amount"""
        try:
            balance = self.get_usdt_balance(address)
            if balance >= expected_amount:
                return {
                    'received': True,
                    'amount': balance,
                    'address': address
                }
            return {'received': False, 'amount': balance}
        except Exception as e:
            logger.error(f"Error checking transaction for {address}: {e}")
            return {'received': False, 'error': str(e)}
    
    @retry_on_rate_limit
    def get_transaction_history(self, address: str, limit: int = 20):
        """Get TRC-20 transaction history for an address"""
        try:
            # Query transactions from your node
            transactions = self.client.get_account_resource(address)
            return transactions
        except Exception as e:
            logger.error(f"Error getting transactions for {address}: {e}")
            return []
    
    @retry_on_rate_limit
    def send_usdt(self, to_address: str, amount: Decimal) -> dict:
        """Send USDT from master wallet to an address"""
        try:
            if not settings.master_wallet_private_key:
                raise ValueError("Master wallet private key not configured")
            
            priv_key = PrivateKey(bytes.fromhex(settings.master_wallet_private_key))
            
            # Convert to smallest unit (6 decimals)
            amount_in_units = int(amount * Decimal(10**6))
            
            txn = (
                self.usdt_contract.functions.transfer(to_address, amount_in_units)
                .with_owner(settings.master_wallet_address)
                .fee_limit(100_000_000)  # 100 TRX fee limit
                .build()
                .sign(priv_key)
            )
            
            result = txn.broadcast()
            
            return {
                'success': True,
                'txid': result['txid'],
                'amount': amount
            }
        except Exception as e:
            logger.error(f"Error sending USDT: {e}")
            return {'success': False, 'error': str(e)}

# Singleton instance
tron_wallet = TronWallet()