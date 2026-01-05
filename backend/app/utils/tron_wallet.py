from tronpy import Tron
from tronpy.keys import PrivateKey
from decimal import Decimal
from ..config import settings
import logging
import time

logger = logging.getLogger(__name__)

class TronWallet:
    def __init__(self):
        # Connect to TronGrid public API
        if settings.trongrid_api_key:
            # With API key for higher rate limits
            self.client = Tron(network='mainnet', api_key=settings.trongrid_api_key)
        else:
            # Without API key (free, limited to default rate limits)
            self.client = Tron(network='mainnet')
        
        try:
            # USDT TRC-20 contract
            self.usdt_contract = self._get_contract_with_retry(settings.usdt_trc20_contract)
        except Exception as e:
            logger.error(f"Failed to initialize USDT contract: {e}")
            self.usdt_contract = None
    
    def _get_contract_with_retry(self, address, max_retries=3):
        """Get contract with retry logic for rate limiting"""
        for attempt in range(max_retries):
            try:
                return self.client.get_contract(address)
            except Exception as e:
                if '429' in str(e) and attempt < max_retries - 1:
                    wait_time = (2 ** attempt) * 2  # Exponential backoff: 2, 4, 8 seconds
                    logger.warning(f"Rate limited, retrying in {wait_time}s...")
                    time.sleep(wait_time)
                else:
                    raise
    
    def generate_deposit_address(self):
        """Generate a new Tron address for deposits"""
        private_key = PrivateKey.random()
        address = private_key.public_key.to_base58check_address()
        return {
            'address': address,
            'private_key': private_key.hex()
        }
    
    def get_usdt_balance(self, address: str) -> Decimal:
        """Get USDT balance for an address"""
        if not self.usdt_contract:
            logger.error("USDT contract not initialized")
            return Decimal(0)
        
        for attempt in range(3):
            try:
                balance = self.usdt_contract.functions.balanceOf(address)
                # USDT has 6 decimals on Tron
                return Decimal(balance) / Decimal(10**6)
            except Exception as e:
                if '429' in str(e) and attempt < 2:
                    wait_time = (2 ** attempt) * 2
                    logger.warning(f"Rate limited on balance check, retrying in {wait_time}s...")
                    time.sleep(wait_time)
                else:
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