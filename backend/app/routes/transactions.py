from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Transaction
from ..routes.auth import get_current_user
from ..utils.tron_wallet import tron_wallet
from pydantic import BaseModel
from decimal import Decimal
import uuid

router = APIRouter()

class TransactionCreate(BaseModel):
    type: str  # 'sell' or 'buy'
    amount_usdt: float = None
    amount_rub: float = None
    payment_method: str  # 'card' or 'bank'
    phone_number: str = None
    bank_name: str = None
    card_number: str = None
    usdt_address: str = None

class TransactionResponse(BaseModel):
    id: int
    hash: str
    type: str
    amount_usdt: float = None
    amount_rub: float = None
    payment_method: str
    status: str
    created_at: str
    deposit_address: str = None
    usdt_address: str = None

@router.post("/transactions", response_model=TransactionResponse)
def create_transaction(transaction: TransactionCreate, db: Session = Depends(get_db)):
    # No authentication required - allow anonymous transactions
    transaction_hash = uuid.uuid4().hex
    
    # Generate deposit address for sell transactions
    deposit_info = None
    if transaction.type == "sell":
        deposit_info = tron_wallet.generate_deposit_address()
    
    db_transaction = Transaction(
        hash=transaction_hash,
        user_id=None,
        type=transaction.type,
        amount_usdt=transaction.amount_usdt,
        amount_rub=transaction.amount_rub,
        payment_method=transaction.payment_method,
        phone_number=transaction.phone_number,
        bank_name=transaction.bank_name,
        card_number=transaction.card_number,
        usdt_address=transaction.usdt_address,
        deposit_address=deposit_info['address'] if deposit_info else None,
        deposit_private_key=deposit_info['private_key'] if deposit_info else None,
        status="pending"
    )
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

@router.get("/transactions", response_model=list[TransactionResponse])
def get_transactions(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    # Only show user's own transactions if logged in
    transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
    return transactions

@router.get("/transactions/{transaction_hash}")
def get_transaction_by_hash(transaction_hash: str, db: Session = Depends(get_db)):
    """Get transaction details by hash - no auth required"""
    tx = db.query(Transaction).filter(Transaction.hash == transaction_hash).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    response = {
        'hash': tx.hash,
        'type': tx.type,
        'amount_usdt': tx.amount_usdt,
        'amount_rub': tx.amount_rub,
        'status': tx.status,
        'created_at': str(tx.created_at),
        'deposit_address': tx.deposit_address if tx.type == 'sell' else None,
        'usdt_address': tx.usdt_address if tx.type == 'buy' else None,
        'tron_txid': tx.tron_txid
    }
    
    # Check blockchain status for sell transactions
    if tx.type == 'sell' and tx.deposit_address and tx.status == 'pending':
        check_result = tron_wallet.check_incoming_transaction(
            tx.deposit_address,
            Decimal(str(tx.amount_usdt))
        )
        if check_result.get('received'):
            tx.status = 'confirming'
            db.commit()
            response['status'] = 'confirming'
    
    return response

@router.post("/transactions/{transaction_hash}/check")
def check_transaction_status(transaction_hash: str, db: Session = Depends(get_db)):
    """Manually check transaction status on blockchain"""
    tx = db.query(Transaction).filter(Transaction.hash == transaction_hash).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if tx.type == 'sell' and tx.deposit_address:
        result = tron_wallet.check_incoming_transaction(
            tx.deposit_address,
            Decimal(str(tx.amount_usdt))
        )
        
        if result.get('received'):
            tx.status = 'confirming'
            db.commit()
            return {'status': 'confirming', 'message': 'Payment received, processing...'}
        else:
            return {'status': 'pending', 'message': 'Waiting for payment', 'balance': str(result.get('amount', 0))}
    
    return {'status': tx.status}