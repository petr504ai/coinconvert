import logging
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes
from decimal import Decimal
from .config import settings
from .sheets_db import sheets_db
from .utils.tron_wallet import tron_wallet

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)


class CoinConvertBot:
    def __init__(self):
        self.bot_token = settings.telegram_bot_token
        self.admin_chat_id = settings.telegram_admin_chat_id
        self.application = None
    
    def is_admin(self, user_id: int) -> bool:
        """Check if user is admin"""
        return str(user_id) == str(self.admin_chat_id)
    
    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /start command"""
        user = update.effective_user
        
        welcome_message = f"""
👋 Привет, {user.first_name}!

Я бот CoinConvert для управления транзакциями.

<b>Доступные команды:</b>
/check [ID] - Проверить статус транзакции
/list - Показать последние транзакции
/help - Показать это сообщение

<b>Примеры:</b>
/check 5 - Проверить транзакцию с ID 5
"""
        
        if self.is_admin(user.id):
            welcome_message += "\n✅ У вас есть права администратора"
        else:
            welcome_message += "\n⚠️ У вас нет прав администратора"
        
        await update.message.reply_text(welcome_message, parse_mode='HTML')
    
    async def help_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /help command"""
        help_text = """
<b>📋 Команды бота CoinConvert:</b>

<b>/check [ID]</b> - Проверить статус транзакции
Пример: /check 5

<b>/list</b> - Показать последние 5 транзакций

<b>/help</b> - Показать это сообщение

<b>Статусы транзакций:</b>
⏳ pending - Ожидание платежа
🔄 confirming - Платеж получен, ждем подтверждений
✅ completed - Транзакция завершена
"""
        await update.message.reply_text(help_text, parse_mode='HTML')
    
    async def check_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /check [ID] command"""
        user = update.effective_user
        
        # Check admin rights
        if not self.is_admin(user.id):
            await update.message.reply_text("❌ У вас нет прав для использования этой команды")
            return
        
        # Check if ID provided
        if not context.args or len(context.args) == 0:
            await update.message.reply_text(
                "❌ Укажите ID транзакции\n\nПример: /check 5",
                parse_mode='HTML'
            )
            return
        
        try:
            transaction_id = int(context.args[0])
        except ValueError:
            await update.message.reply_text("❌ ID транзакции должен быть числом")
            return
        
        # Send "checking" message
        checking_msg = await update.message.reply_text(
            f"🔍 Проверяю транзакцию #{transaction_id}...",
            parse_mode='HTML'
        )
        
        try:
            # Get transaction from database
            all_transactions = sheets_db.get_all_transactions()
            transaction = None
            
            for tx in all_transactions:
                if tx.get('id') == transaction_id or str(tx.get('id')) == str(transaction_id):
                    transaction = tx
                    break
            
            if not transaction:
                await checking_msg.edit_text(f"❌ Транзакция #{transaction_id} не найдена")
                return
            
            # Build transaction info message
            tx_type = transaction.get('type', 'unknown').upper()
            status = transaction.get('status', 'unknown')
            amount_usdt = transaction.get('amount_usdt', 'N/A')
            amount_rub = transaction.get('amount_rub', 'N/A')
            
            status_icons = {
                'pending': '⏳',
                'confirming': '🔄',
                'completed': '✅',
                'failed': '❌'
            }
            status_icon = status_icons.get(status, '📋')
            
            message = f"<b>📊 Транзакция #{transaction_id}</b>\n\n"
            message += f"<b>Тип:</b> {tx_type}\n"
            message += f"<b>Статус:</b> {status_icon} {status}\n"
            message += f"<b>USDT:</b> {amount_usdt}\n"
            message += f"<b>RUB:</b> {amount_rub}\n"
            
            # For sell transactions, check blockchain status
            if transaction.get('type') == 'sell' and transaction.get('deposit_address'):
                deposit_address = transaction['deposit_address']
                message += f"\n<b>📬 Адрес депозита:</b>\n<code>{deposit_address}</code>\n"
                
                # Check blockchain
                if status != 'completed':
                    message += "\n🔍 <b>Проверка блокчейна...</b>\n"
                    
                    current_status = transaction.get('status', 'pending')
                    check_confirmations = (current_status == 'confirming')
                    
                    result = tron_wallet.check_incoming_transaction(
                        deposit_address,
                        Decimal(str(amount_usdt)),
                        check_confirmations=check_confirmations
                    )
                    
                    balance = result.get('amount', 0)
                    message += f"\n💰 <b>Баланс:</b> {balance} USDT\n"
                    
                    if result.get('received'):
                        if check_confirmations:
                            confirmations = result.get('min_confirmations', 0)
                            message += f"✅ <b>Подтверждения:</b> {confirmations}/20\n"
                            
                            if result.get('confirmed'):
                                # Update to completed
                                sheets_db.update_transaction(transaction_id, {'status': 'completed'})
                                message += "\n🎉 <b>Транзакция завершена!</b>"
                                logger.info(f"Transaction #{transaction_id} marked as completed by bot command")
                            else:
                                # Update to confirming if was pending
                                if current_status == 'pending':
                                    sheets_db.update_transaction(transaction_id, {'status': 'confirming'})
                                    message += "\n⏳ Ожидание подтверждений..."
                                else:
                                    message += f"\n⏳ Недостаточно подтверждений (нужно 20)"
                        else:
                            # Just received, move to confirming
                            sheets_db.update_transaction(transaction_id, {'status': 'confirming'})
                            message += "\n✅ Платеж получен! Ожидание подтверждений..."
                            logger.info(f"Transaction #{transaction_id} moved to confirming by bot command")
                    else:
                        message += "\n⏳ Ожидание платежа..."
            
            await checking_msg.edit_text(message, parse_mode='HTML')
            
        except Exception as e:
            logger.error(f"Error checking transaction: {e}")
            await checking_msg.edit_text(f"❌ Ошибка при проверке транзакции: {str(e)}")
    
    async def list_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /list command - show recent transactions"""
        user = update.effective_user
        
        # Check admin rights
        if not self.is_admin(user.id):
            await update.message.reply_text("❌ У вас нет прав для использования этой команды")
            return
        
        try:
            transactions = sheets_db.get_all_transactions()
            
            if not transactions:
                await update.message.reply_text("📭 Транзакций нет")
                return
            
            # Get last 5 transactions
            recent_transactions = transactions[-5:] if len(transactions) > 5 else transactions
            recent_transactions.reverse()  # Show newest first
            
            message = "<b>📋 Последние транзакции:</b>\n\n"
            
            status_icons = {
                'pending': '⏳',
                'confirming': '🔄',
                'completed': '✅',
                'failed': '❌'
            }
            
            for tx in recent_transactions:
                tx_id = tx.get('id', 'N/A')
                tx_type = tx.get('type', 'unknown').upper()
                status = tx.get('status', 'unknown')
                amount_usdt = tx.get('amount_usdt', 'N/A')
                status_icon = status_icons.get(status, '📋')
                
                message += f"<b>#{tx_id}</b> | {tx_type} | {status_icon} {status}\n"
                message += f"   💵 {amount_usdt} USDT\n\n"
            
            message += "\nИспользуйте /check [ID] для проверки"
            
            await update.message.reply_text(message, parse_mode='HTML')
            
        except Exception as e:
            logger.error(f"Error listing transactions: {e}")
            await update.message.reply_text(f"❌ Ошибка: {str(e)}")
    
    async def error_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle errors"""
        logger.error(f"Update {update} caused error {context.error}")
    
    def setup(self):
        """Setup bot handlers"""
        if not self.bot_token or self.bot_token == "your-bot-token-here":
            logger.error("Telegram bot token not configured!")
            return False
        
        self.application = Application.builder().token(self.bot_token).build()
        
        # Add command handlers
        self.application.add_handler(CommandHandler("start", self.start_command))
        self.application.add_handler(CommandHandler("help", self.help_command))
        self.application.add_handler(CommandHandler("check", self.check_command))
        self.application.add_handler(CommandHandler("list", self.list_command))
        
        # Add error handler
        self.application.add_error_handler(self.error_handler)
        
        logger.info("Telegram bot handlers setup complete")
        return True
    
    def run(self):
        """Run the bot"""
        if not self.setup():
            logger.error("Failed to setup bot")
            return
        
        logger.info("Starting Telegram bot...")
        logger.info(f"Admin chat ID: {self.admin_chat_id}")
        self.application.run_polling(allowed_updates=Update.ALL_TYPES)


# Create bot instance
bot = CoinConvertBot()


def start_bot():
    """Start the bot - called from main script"""
    bot.run()


if __name__ == "__main__":
    start_bot()
