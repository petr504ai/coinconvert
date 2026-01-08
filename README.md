# CoinConvert

A cryptocurrency exchange platform for USDT (TRC-20) and Russian Rubles with automated transaction monitoring and Telegram bot management.

## Features

### Core Functionality
- **Sell USDT for RUB** - Receive payment to credit card or bank account
- **Buy USDT with RUB** - Send rubles and receive USDT to your wallet
- **Flexible Currency Input** - Enter amounts in either USDT or RUB with automatic conversion
- **No Registration Required** - Exchange immediately without account creation
- **Transaction Tracking** - Monitor status via unique hash
- **Real-time Exchange Rates** - Automated rate fetching with configurable margins

### Automation & Monitoring
- **Telegram Notifications** - Instant alerts for new transactions
- **Telegram Bot Commands** - Manage transactions via bot:
  - `/check [ID]` - Check transaction status and update confirmations
  - `/markpaid [ID]` - Mark buy transactions as paid (admin only)
  - `/list` - View recent transactions
  - `/help` - Get command help
- **Telegram Support System** - Two-way messaging between users and admin
- **Blockchain Monitoring** - TRC-20 USDT tracking via TronGrid API
- **Automatic Status Updates** - Smart confirmation tracking (20+ confirmations required)
- **Transaction Lifecycle Management** - `pending` → `confirming` → `completed`

### Security & Validation
- **Phone Number Validation** - +7XXXXXXXXXX format (Russian numbers)
- **Tron Address Validation** - Verify TRC-20 wallet addresses
- **Admin-Only Bot Access** - Secure command execution
- **Google Sheets Database** - Transaction storage with automatic syncing

## Tech Stack

- **Backend:** Python FastAPI
- **Frontend:** React with React Router
- **Database:** Google Sheets API
- **Blockchain:** Tron Network (TRC-20 USDT) via TronGrid API
- **Notifications:** Telegram Bot API
- **Exchange Rates:** CoinGecko API

## Setup

### Prerequisites
- Python 3.11+
- Node.js 16+ & npm
- Google Service Account (for Sheets API)
- Telegram Bot Token (from @BotFather)
- TronGrid API Key (optional, recommended)

### Backend Setup

1. **Create Virtual Environment**
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1  # Windows PowerShell
source .venv/bin/activate      # Linux/Mac
```

2. **Install Dependencies**
```bash
pip install -r requirements.txt
```

3. **Configure Environment**
Copy `.env.example` to `.env` and configure:

```env
# Google Sheets Configuration
GOOGLE_SHEETS_CREDENTIALS_FILE=service-account.json
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id

# Security
SECRET_KEY=your-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Tron Network
TRONGRID_API_KEY=your_api_key_from_trongrid
TRON_PRO_API_KEY=your_api_key_from_trongrid
USDT_TRC20_CONTRACT=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t
MASTER_WALLET_ADDRESS=your_tron_wallet_address

# Rate Limiting & Retry
MAX_RETRIES=5
RETRY_DELAY=5.0
RETRY_ON_RATE_LIMIT=true

# Pricing & Margins
BUY_MARGIN=0.05   # 5% markup when users buy
SELL_MARGIN=0.03  # 3% discount when users sell
EXCHANGE_RATE_CACHE_MINUTES=5

# Telegram Notifications
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_CHAT_ID=your_chat_id
TELEGRAM_ADMIN_CHAT_ID=your_admin_chat_id

# Merchant Payment Details (for buy transactions)
MERCHANT_PHONE_NUMBER=+79123456789
MERCHANT_BANK_NAME=Сбербанк
```

4. **Setup Google Sheets**
- Create a Google Cloud project
- Enable Google Sheets API
- Create service account and download JSON credentials
- Save as `service-account.json` in backend folder
- Share your Google Sheet with the service account email
- See `GOOGLE_SHEETS_SETUP.md` for detailed instructions

5. **Setup Telegram Bot**
- Message @BotFather on Telegram
- Use `/newbot` to create a new bot
- Copy the bot token to `.env`
- Send a message to your bot
- Visit `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates` to get your chat ID

### Run Backend

**Main API Server:**
```bash
cd backend
uvicorn app.main:app --reload
```
Runs on: `http://localhost:8000`

**Telegram Bot (in separate terminal):**
```bash
cd backend
python run_bot.py
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```
Runs on: `http://localhost:3000`

## Usage

### Web Interface

1. Navigate to `http://localhost:3000`
2. **Access Support:** Click "💬 Поддержка в Telegram" for help
3. Choose **Buy** or **Sell** USDT
4. **Select Currency:** Toggle between USDT and RUB input
5. **Enter Amount:** System automatically calculates the other currency
6. **Fill Form:**
   - **For Sell:** Phone, bank, and receive payment details
   - **For Buy:** Only USDT address needed
7. **Submit Transaction:** Receive unique transaction hash
8. **Track Status:** Transaction details page auto-refreshes every 10 seconds

### Buy USDT Flow (Simplified)

1. **Enter Amount & USDT Address** - That's all!
2. **View Payment Details** - After submission, see merchant phone & bank
3. **Send RUB** - Transfer to provided merchant details via SBP
4. **Confirmation** - Admin marks as paid via `/markpaid [ID]`
5. **Receive USDT** - Sent to your provided address

### Sell USDT Flow

1. **Enter Amount & Payment Details** - Provide phone, bank for receiving RUB
2. **Get Deposit Address** - Unique TRC-20 address generated
3. **Send USDT** - Transfer to the deposit address
4. **Auto-Detection** - System monitors blockchain
5. **Confirmations** - Waits for 20+ block confirmations
6. **Receive RUB** - Payment sent to your provided details

### Transaction Status Flow

- **pending:** Waiting for payment
- **confirming:** Payment received, waiting for 20+ blockchain confirmations
- **completed:** Transaction confirmed and finalized

### Telegram Bot Commands

**For All Users:**
```
/start - Welcome message and instructions
```

**For Admin Only:**
```
/check [ID] - Check transaction status and update confirmations
/markpaid [ID] - Mark buy transaction as paid/completed
/list - Show last 5 transactions
/help - Show all commands
```

**Support Messaging (All Users):**
- Users: Send any message to bot → forwarded to admin
- Admin: Reply to user message → sent back to user
- Two-way communication for customer support

**Examples:**
```
User: "Здравствуйте, где мои USDT?"
→ Admin receives message with user details
→ Admin replies to that message
→ User receives admin's response

Admin: /markpaid 7
→ Marks transaction #7 as completed
→ Shows USDT address to send coins to
```

## API Documentation

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

## Key Endpoints

### Transactions
- `POST /api/transactions` - Create new transaction
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/{hash}` - Get transaction by hash
- `POST /api/transactions/{hash}/check` - Manual blockchain status check

### Pricing
- `GET /pricing` - Get current exchange rates and pricing

### Authentication (Optional)
- `POST /auth/register` - Register user account
- `POST /auth/token` - Login

## Architecture

### Sell USDT Flow
1. User submits sell form with USDT amount
2. System calculates RUB amount using current rate with sell margin
3. Unique TRC-20 deposit address generated
4. Transaction saved to Google Sheets
5. Telegram notification sent
6. User sends USDT to deposit address
7. Manual check (web or bot) verifies blockchain
8. Status: `pending` → `confirming` (funds received)
9. System monitors confirmations (minimum 20 required)
10. Status: `confirming` → `completed` (20+ confirmations)

### Buy USDT Flow
1. User submits buy form with amount (USDT or RUB) and their USDT address
2. System calculates both amounts using buy margin
3. **Transaction page shows merchant payment details:**
   - Merchant phone number (for SBP transfer)
   - Merchant bank name
4. Transaction saved to Google Sheets
5. Telegram notification sent to admin
6. User transfers RUB to merchant account
7. Admin verifies payment receipt
8. **Admin uses `/markpaid [ID]` command** to mark as completed
9. Admin sends USDT to user's provided address
10. Transaction marked as completed

## Transaction Monitoring

### Automatic Confirmation Tracking
The system checks blockchain confirmations:
- Fetches all incoming TRC-20 transactions
- Calculates confirmations (current block - transaction block)
- Requires minimum 20 confirmations across ALL incoming transactions
- Updates status automatically when threshold met

### Manual Checking
Two methods available:
1. **Web API:** `POST /api/transactions/{hash}/check`
2. **Telegram Bot:** `/check [transaction_id]`

Both methods:
- Check current balance on deposit address
- Verify confirmation count if funds received
- Update Google Sheets automatically
- Return detailed status information

## Configuration

### Exchange Rate Margins
Configured in `.env`:
- `BUY_MARGIN=0.05` → Users pay 5% above market rate
- `SELL_MARGIN=0.03` → Users receive 3% below market rate
- `EXCHANGE_RATE_CACHE_MINUTES=5` → Cache rates for 5 minutes

### Phone Number Format
Validated as: `+7XXXXXXXXXX` (Russian mobile numbers, only for sell transactions)

### Merchant Payment Details
For buy transactions, users see merchant details on transaction page:
- `MERCHANT_PHONE_NUMBER` - Phone for SBP transfers
- `MERCHANT_BANK_NAME` - Bank name for transfers

### Confirmation Requirements
- Minimum confirmations: **20 blocks**
- Checks all incoming transactions to deposit address
- Uses minimum confirmation count across all transactions

## Telegram Bot Features

### Admin Commands
- **Transaction Management:**
  - `/check [ID]` - Verify blockchain status, update confirmations
  - `/markpaid [ID]` - Mark buy transaction as paid/completed
  - `/list` - View recent transactions

### Support System
- **User → Admin:** Users send messages, auto-forwarded to admin with user details
- **Admin → User:** Reply to user message, auto-sent to original user
- **Two-way Chat:** Seamless support communication
- **User Info Included:** Name, username, User ID with each message

## Security Notes

⚠️ **CRITICAL SECURITY REQUIREMENTS:**

1. **Never commit sensitive files:**
   - `.env` - Contains all credentials
   - `service-account.json` - Google Sheets access
   - Files are in `.gitignore`

2. **Use strong secrets:**
   - Generate strong `SECRET_KEY` for JWT tokens
   - Rotate API keys regularly
   - Use environment-specific credentials

3. **Protect private keys:**
   - Store master wallet keys securely
   - Consider hardware wallet for production
   - Never expose private keys in logs

4. **Restrict bot access:**
   - Set `TELEGRAM_ADMIN_CHAT_ID` correctly
   - Only admin can execute bot commands
   - Verify chat ID before production

5. **API security:**
   - Use rate limiting in production
   - Implement proper CORS policies
   - Add authentication for sensitive endpoints

## Project Structure

```
coinconvert/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application
│   │   ├── config.py            # Configuration settings
│   │   ├── sheets_db.py         # Google Sheets database
│   │   ├── telegram_bot.py      # Telegram bot handler
│   │   ├── models/              # Data models
│   │   ├── routes/              # API endpoints
│   │   │   ├── transactions.py  # Transaction management
│   │   │   └── auth.py          # Authentication
│   │   └── utils/               # Utilities
│   │       ├── tron_wallet.py   # Tron blockchain integration
│   │       ├── exchange_rate.py # Rate fetching & calculation
│   │       ├── telegram_notification.py # Notifications
│   │       └── security.py      # Password hashing
│   ├── run_bot.py               # Telegram bot launcher
│   ├── requirements.txt         # Python dependencies
│   ├── .env                     # Environment config (not in git)
│   └── service-account.json     # Google credentials (not in git)
├── frontend/
│   ├── src/
│   │   ├── App.js               # Main React component
│   │   ├── components/
│   │   │   ├── BuyForm.js       # Buy USDT form (USDT address only)
│   │   │   ├── SellForm.js      # Sell USDT form (phone, bank, amounts)
│   │   │   ├── TransactionDetails.js # Status page with merchant info
│   │   │   ├── Dashboard.js     # Main page with support link
│   │   │   ├── Login.js         # User login
│   │   │   └── BankSelect.js    # Bank dropdown
│   │   └── data/
│   │       └── banks.js         # Russian banks list
│   └── package.json             # Node dependencies
├── .gitignore                   # Git ignore rules
├── README.md                    # This file
└── GOOGLE_SHEETS_SETUP.md       # Sheets setup guide
```

## Troubleshooting

### Backend Issues

**Rate Limiting (429 errors):**
- Get free TronGrid API key from https://www.trongrid.io
- Add to `.env` as `TRONGRID_API_KEY`
- Restart backend server

**Google Sheets Connection:**
- Verify service account JSON file exists
- Check spreadsheet ID in `.env`
- Ensure sheet is shared with service account email
- Check worksheets exist: "Transactions" and "Users"

**Telegram Bot Not Responding:**
- Verify bot token is correct
- Check bot is running (`python run_bot.py`)
- Confirm admin chat ID matches your Telegram user ID
- Use `/start` to test bot connectivity
- Check if user messages are being forwarded to admin

**Support Messages Not Working:**
- Ensure bot has message handler enabled
- Admin must reply to forwarded messages (not send new ones)
- Check User ID is included in forwarded message
- Verify bot permissions allow sending messages

### Frontend Issues

**Exchange Rates Not Loading:**
- Check backend is running
- Verify `/pricing` endpoint works
- Check console for API errors

**Transaction Status Not Updating:**
- Page auto-refreshes every 10 seconds
- Manually refresh if needed
- Check backend logs for errors

## Development

### Running in Development Mode

1. Start backend with auto-reload:
```bash
cd backend
uvicorn app.main:app --reload
```

2. Start Telegram bot:
```bash
cd backend
python run_bot.py
```

3. Start frontend with hot reload:
```bash
cd frontend
npm start
```

### Testing Transactions

**Buy USDT Test:**
1. Open frontend, go to Buy tab
2. Enter amount and your USDT address
3. Submit - note the transaction ID
4. Check transaction details page for merchant info
5. Admin uses `/markpaid [ID]` to complete

**Sell USDT Test:**
1. Use TronLink wallet on testnet (Nile)
2. Get test TRX from faucet
3. Set `USDT_TRC20_CONTRACT` to testnet contract
4. Submit sell form with phone/bank
5. Send USDT to generated deposit address
6. Use `/check [ID]` to monitor confirmations
7. Test full transaction flow

**Support System Test:**
1. Users: Send message to bot
2. Admin: Check if message arrives with User ID
3. Admin: Reply to the message
4. User: Verify reply is received

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is for educational purposes. Ensure compliance with local cryptocurrency regulations before deployment.

## Demo
Live demo is at :  https://www.coinconvert.ru

## Support

For issues and questions:
- Check documentation and troubleshooting section
- Review backend logs for errors
- Test API endpoints with Swagger UI
- Verify all environment variables are set correctly

---

**⚠️ Disclaimer:** This is educational software. Cryptocurrency trading involves risk. Ensure compliance with local laws and regulations. Never store large amounts in hot wallets.