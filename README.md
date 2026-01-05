# CoinConvert

A cryptocurrency exchange website for USDT (TRC-20) and Russian Rubles.

## Features

- Sell USDT for RUB (to credit card or bank account)
- Buy USDT by sending RUB from bank account
- No registration required - exchange immediately
- Transaction tracking via unique hash
- TRC-20 USDT monitoring via TronGrid API
- Optional user accounts for transaction history

## Tech Stack

- Backend: Python FastAPI
- Frontend: React
- Database: SQLite
- Blockchain: Tron (TRC-20 USDT) via TronGrid API

## Setup

### Prerequisites
- Python 3.10+
- Node.js & npm

### Backend Setup

```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1  # Windows PowerShell
source venv/bin/activate     # Linux/Mac

pip install -r requirements.txt

# Create .env file with your configuration
cp .env.example ../.env
# Edit backend/.env with your wallet details
```

### Environment Configuration

Edit the `.env` file in the backend root:

```env
# Security (change in production)
SECRET_KEY=your-secret-key-here

# Tron Configuration
TRONGRID_API_KEY=  # Optional: get from https://www.trongrid.io
MASTER_WALLET_ADDRESS=your_wallet_address
MASTER_WALLET_PRIVATE_KEY=your_private_key
```

### Run Backend

```bash
uvicorn app.main:app --reload
```

Backend runs on: `http://127.0.0.1:8000`

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend runs on: `http://localhost:3000`

## Usage

1. Open http://localhost:3000
2. Choose "Sell USDT" or "Buy USDT"
3. Fill in the form
4. Submit transaction
5. Save your transaction hash to track status
6. (Optional) Create account to view transaction history

## API Documentation

- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

## Key Endpoints

- `POST /api/transactions` - Create new transaction
- `GET /api/transactions/{hash}` - Check transaction status
- `POST /api/transactions/{hash}/check` - Verify blockchain status
- `POST /auth/register` - Register account (optional)
- `POST /auth/token` - Login

## Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env` file with real wallet keys
- Use strong `SECRET_KEY` in production
- Store private keys securely
- Consider using hardware wallets for master wallet in production

## Architecture

### Sell USDT Flow
1. User submits sell form
2. System generates unique TRC-20 deposit address
3. User sends USDT to deposit address
4. System monitors blockchain for incoming USDT
5. Upon confirmation, processes RUB payment to user's bank

### Buy USDT Flow
1. User submits buy form with desired amount
2. System creates pending transaction
3. User sends RUB to merchant account
4. Upon payment confirmation, system sends USDT to user's address

## Transaction Hash

Each transaction gets a unique 32-character hash (UUID) that can be used to track status without authentication.