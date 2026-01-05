import requests
import logging
from typing import Dict, Optional
from ..config import settings

logger = logging.getLogger(__name__)

class TelegramNotifier:
    def __init__(self):
        self.bot_token = settings.telegram_bot_token
        self.chat_id = settings.telegram_chat_id
        self.api_url = f"https://api.telegram.org/bot{self.bot_token}/sendMessage"
    
    def send_message(self, message: str) -> bool:
        """Send a message to the configured Telegram chat"""
        if not self.bot_token or not self.chat_id:
            logger.warning("Telegram bot token or chat ID not configured. Skipping notification.")
            return False
        
        if self.bot_token == "your-bot-token-here" or self.chat_id == "your-chat-id-here":
            logger.warning("Telegram credentials not properly configured. Skipping notification.")
            return False
        
        try:
            payload = {
                'chat_id': self.chat_id,
                'text': message,
                'parse_mode': 'HTML'
            }
            
            response = requests.post(self.api_url, json=payload, timeout=10)
            
            if response.status_code == 200:
                logger.info("Telegram notification sent successfully")
                return True
            else:
                logger.error(f"Failed to send Telegram notification. Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending Telegram notification: {e}")
            return False
    
    def send_transaction_notification(self, transaction_data: Dict) -> bool:
        """Send a formatted notification for a new transaction"""
        try:
            transaction_type = transaction_data.get('type', 'Unknown').upper()
            amount_usdt = transaction_data.get('amount_usdt', 'N/A')
            amount_rub = transaction_data.get('amount_rub', 'N/A')
            payment_method = transaction_data.get('payment_method', 'N/A')
            status = transaction_data.get('status', 'Unknown')
            transaction_hash = transaction_data.get('hash', 'N/A')
            transaction_id = transaction_data.get('id', 'N/A')
            
            # Format the message
            message = f"🔔 <b>New Transaction Alert!</b>\n\n"
            message += f"📋 <b>Transaction ID:</b> {transaction_id}\n"
            message += f"🔑 <b>Hash:</b> <code>{transaction_hash}</code>\n"
            message += f"📊 <b>Type:</b> {transaction_type}\n"
            message += f"💵 <b>Amount USDT:</b> {amount_usdt}\n"
            message += f"💰 <b>Amount RUB:</b> {amount_rub}\n"
            message += f"💳 <b>Payment Method:</b> {payment_method}\n"
            message += f"📈 <b>Status:</b> {status}\n"
            
            # Add additional info based on transaction type
            if transaction_type == "SELL":
                deposit_address = transaction_data.get('deposit_address')
                if deposit_address:
                    message += f"📬 <b>Deposit Address:</b> <code>{deposit_address}</code>\n"
            elif transaction_type == "BUY":
                usdt_address = transaction_data.get('usdt_address')
                if usdt_address:
                    message += f"📤 <b>USDT Address:</b> <code>{usdt_address}</code>\n"
            
            # Add bank/card details
            bank_name = transaction_data.get('bank_name')
            if bank_name:
                message += f"🏦 <b>Bank:</b> {bank_name}\n"
            
            card_number = transaction_data.get('card_number')
            if card_number:
                # Mask card number for security
                masked_card = card_number[-4:] if len(card_number) >= 4 else card_number
                message += f"💳 <b>Card:</b> ****{masked_card}\n"
            
            phone_number = transaction_data.get('phone_number')
            if phone_number:
                message += f"📱 <b>Phone:</b> {phone_number}\n"
            
            message += f"\n⏰ <b>Created:</b> {transaction_data.get('created_at', 'N/A')}"
            
            return self.send_message(message)
            
        except Exception as e:
            logger.error(f"Error formatting transaction notification: {e}")
            return False

# Create a singleton instance
telegram_notifier = TelegramNotifier()
