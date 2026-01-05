import gspread
from google.oauth2.service_account import Credentials
from datetime import datetime
import logging
from typing import List, Dict, Optional
from .config import settings

logger = logging.getLogger(__name__)

class GoogleSheetsDB:
    def __init__(self):
        self.client = None
        self.sheet = None
        self.transactions_worksheet = None
        self.users_worksheet = None
        self._init_connection()
    
    def _init_connection(self):
        """Initialize connection to Google Sheets"""
        try:
            # Define the scope
            scopes = [
                'https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/drive'
            ]
            
            # Authenticate using service account
            creds = Credentials.from_service_account_file(
                settings.google_sheets_credentials_file,
                scopes=scopes
            )
            
            self.client = gspread.authorize(creds)
            self.sheet = self.client.open_by_key(settings.google_sheets_spreadsheet_id)
            
            # Get or create worksheets
            self._setup_worksheets()
            logger.info("Successfully connected to Google Sheets")
            
        except Exception as e:
            logger.error(f"Failed to connect to Google Sheets: {e}")
            raise
    
    def _setup_worksheets(self):
        """Create worksheets if they don't exist"""
        try:
            self.transactions_worksheet = self.sheet.worksheet("Transactions")
        except gspread.WorksheetNotFound:
            self.transactions_worksheet = self.sheet.add_worksheet(
                title="Transactions",
                rows=1000,
                cols=20
            )
            # Add headers
            headers = [
                'id', 'hash', 'user_id', 'type', 'amount_usdt', 'amount_rub',
                'payment_method', 'phone_number', 'bank_name', 'card_number',
                'usdt_address', 'deposit_address', 'deposit_private_key',
                'tron_txid', 'status', 'created_at', 'updated_at'
            ]
            self.transactions_worksheet.append_row(headers)
            logger.info("Created Transactions worksheet")
        
        try:
            self.users_worksheet = self.sheet.worksheet("Users")
        except gspread.WorksheetNotFound:
            self.users_worksheet = self.sheet.add_worksheet(
                title="Users",
                rows=1000,
                cols=10
            )
            # Add headers
            headers = ['id', 'email', 'hashed_password', 'created_at']
            self.users_worksheet.append_row(headers)
            logger.info("Created Users worksheet")
    
    def create_transaction(self, transaction_data: Dict) -> Dict:
        """Create a new transaction"""
        try:
            # Get next ID
            all_records = self.transactions_worksheet.get_all_values()
            next_id = len(all_records)  # Header is row 1, so this gives us the next ID
            
            # Prepare row data - ensure all values are strings or numbers
            now = datetime.utcnow().isoformat()
            row = [
                str(next_id),
                str(transaction_data.get('hash', '')),
                str(transaction_data.get('user_id', '')),
                str(transaction_data.get('type', '')),
                str(transaction_data.get('amount_usdt', '')),
                str(transaction_data.get('amount_rub', '')),
                str(transaction_data.get('payment_method', '')),
                str(transaction_data.get('phone_number', '')),
                str(transaction_data.get('bank_name', '')),
                str(transaction_data.get('card_number', '')),
                str(transaction_data.get('usdt_address', '')),
                str(transaction_data.get('deposit_address', '')),
                str(transaction_data.get('deposit_private_key', '')),
                str(transaction_data.get('tron_txid', '')),
                str(transaction_data.get('status', 'pending')),
                str(now),
                str(now)
            ]
            
            # Append row with explicit value_input_option
            self.transactions_worksheet.append_row(row, value_input_option='RAW')
            logger.info(f"Created transaction with ID: {next_id}, row data: {len(row)} columns")
            
            # Return transaction with ID
            transaction_data['id'] = next_id
            transaction_data['created_at'] = now
            transaction_data['updated_at'] = now
            return transaction_data
            
        except Exception as e:
            logger.error(f"Error creating transaction: {e}")
            raise
    
    def get_transaction_by_hash(self, hash: str) -> Optional[Dict]:
        """Get transaction by hash"""
        try:
            logger.info(f"Searching for transaction with hash: {hash}")
            records = self.transactions_worksheet.get_all_records()
            logger.info(f"Found {len(records)} total transactions")
            
            for record in records:
                record_hash = record.get('hash', '').strip()
                if record_hash == hash:
                    logger.info(f"Transaction found: ID={record.get('id')}")
                    return record
            
            logger.warning(f"Transaction not found for hash: {hash}")
            # Log first few hashes for debugging
            if records:
                sample_hashes = [r.get('hash', '')[:20] for r in records[:3]]
                logger.info(f"Sample hashes in DB: {sample_hashes}")
            return None
        except Exception as e:
            logger.error(f"Error getting transaction by hash: {e}")
            logger.exception("Full traceback:")
            return None
    
    def get_transactions_by_user(self, user_id: int) -> List[Dict]:
        """Get all transactions for a user"""
        try:
            records = self.transactions_worksheet.get_all_records()
            user_transactions = [r for r in records if r.get('user_id') == str(user_id)]
            return user_transactions
        except Exception as e:
            logger.error(f"Error getting user transactions: {e}")
            return []
    
    def get_all_transactions(self) -> List[Dict]:
        """Get all transactions"""
        try:
            return self.transactions_worksheet.get_all_records()
        except Exception as e:
            logger.error(f"Error getting all transactions: {e}")
            return []
    
    def update_transaction(self, transaction_id: int, updates: Dict) -> bool:
        """Update a transaction"""
        try:
            # Find the row (add 2 because: 1 for header, 1 for 0-indexing)
            row_num = transaction_id + 1
            
            # Get current row
            row = self.transactions_worksheet.row_values(row_num)
            headers = self.transactions_worksheet.row_values(1)
            
            # Update fields
            for key, value in updates.items():
                if key in headers:
                    col_idx = headers.index(key) + 1
                    self.transactions_worksheet.update_cell(row_num, col_idx, value)
            
            # Update timestamp
            updated_at_col = headers.index('updated_at') + 1
            self.transactions_worksheet.update_cell(
                row_num,
                updated_at_col,
                datetime.utcnow().isoformat()
            )
            
            logger.info(f"Updated transaction {transaction_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating transaction: {e}")
            return False
    
    # User methods
    def create_user(self, email: str, hashed_password: str) -> Dict:
        """Create a new user"""
        try:
            all_records = self.users_worksheet.get_all_values()
            next_id = len(all_records)
            now = datetime.utcnow().isoformat()
            
            row = [next_id, email, hashed_password, now]
            self.users_worksheet.append_row(row)
            
            logger.info(f"Created user with ID: {next_id}")
            return {
                'id': next_id,
                'email': email,
                'hashed_password': hashed_password,
                'created_at': now
            }
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            raise
    
    def get_user_by_email(self, email: str) -> Optional[Dict]:
        """Get user by email"""
        try:
            records = self.users_worksheet.get_all_records()
            for record in records:
                if record.get('email') == email:
                    return record
            return None
        except Exception as e:
            logger.error(f"Error getting user by email: {e}")
            return None
    
    def get_user_by_id(self, user_id: int) -> Optional[Dict]:
        """Get user by ID"""
        try:
            records = self.users_worksheet.get_all_records()
            for record in records:
                if record.get('id') == user_id:
                    return record
            return None
        except Exception as e:
            logger.error(f"Error getting user by ID: {e}")
            return None

# Singleton instance
sheets_db = GoogleSheetsDB()
