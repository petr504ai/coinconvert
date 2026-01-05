from tronpy import Tron
from tronpy.keys import PrivateKey
from decimal import Decimal
from ..config import settings
import logging

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
        
        # USDT TRC-20 contract
        self.usdt_contract = self.client.get_contract(settings.usdt_trc20_contract)
    
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
        try:
            balance = self.usdt_contract.functions.balanceOf(address)
            # USDT has 6 decimals on Tron
            return Decimal(balance) / Decimal(10**6)
        except Exception as e:
            logger.error(f"Error getting balance for {address}: {e}")
            return Decimal(0)
    
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