"""
Telegram Bot Launcher for CoinConvert

This script starts the Telegram bot that allows administrators
to check transaction status via commands like /check [ID]

Run this script in a separate terminal:
    python run_bot.py

Or with the virtual environment activated:
    .venv/Scripts/python run_bot.py
"""

import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.telegram_bot import start_bot

if __name__ == "__main__":
    print("=" * 80)
    print("CoinConvert Telegram Bot")
    print("=" * 80)
    print("\nStarting bot...")
    print("Press Ctrl+C to stop\n")
    
    try:
        start_bot()
    except KeyboardInterrupt:
        print("\n\nBot stopped by user")
    except Exception as e:
        print(f"\n\nError: {e}")
        sys.exit(1)
