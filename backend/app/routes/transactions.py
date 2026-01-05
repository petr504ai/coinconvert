from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from ..utils.tron_wallet import tron_wallet
from ..sheets_db import sheets_db
import uuid
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class TransactionCreate(BaseModel):
    type: str  # 'sell' or 'buy'
    amount_usdt: Optional[float] = None
    amount_rub: Optional[float] = None
    payment_method: str  # 'card' or 'bank'
    phone_number: Optional[str] = None
    bank_name: Optional[str] = None
    card_number: Optional[str] = None
    usdt_address: Optional[str] = None

class TransactionResponse(BaseModel):
    id: int
    hash: str
    type: str
    amount_usdt: Optional[float] = None
    amount_rub: Optional[float] = None
    payment_method: str
    status: str
    created_at: str
    deposit_address: Optional[str] = None
    usdt_address: Optional[str] = None

@router.post("/transactions", response_model=TransactionResponse)
def create_transaction(transaction: TransactionCreate):
    logger.info("=" * 80)
    logger.info("Creating new transaction")
    logger.info(f"Transaction type: {transaction.type}")
    logger.info(f"Amount USDT: {transaction.amount_usdt}")
    logger.info(f"Amount RUB: {transaction.amount_rub}")
    logger.info(f"Payment method: {transaction.payment_method}")
    logger.info(f"Phone number: {transaction.phone_number}")
    logger.info(f"Bank name: {transaction.bank_name}")
    logger.info(f"Card number: {transaction.card_number}")
    logger.info(f"USDT address: {transaction.usdt_address}")
    logger.info("=" * 80)
    
    # Generate transaction hash
    transaction_hash = uuid.uuid4().hex
    logger.info(f"Generated transaction hash: {transaction_hash}")
    
    # Generate deposit address for sell transactions
    deposit_info = None
    if transaction.type == "sell":
        logger.info("Generating deposit address for sell transaction...")
        try:
            deposit_info = tron_wallet.generate_deposit_address()
            logger.info(f"Generated deposit address: {deposit_info['address']}")
        except Exception as e:
            logger.error(f"Error generating deposit address: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to generate deposit address: {str(e)}")
    
    try:
        # Prepare transaction data
        transaction_data = {
            'hash': transaction_hash,
            'user_id': None,
            'type': transaction.type,
            'amount_usdt': transaction.amount_usdt,
            'amount_rub': transaction.amount_rub,
            'payment_method': transaction.payment_method,
            'phone_number': transaction.phone_number,
            'bank_name': transaction.bank_name,
            'card_number': transaction.card_number,
            'usdt_address': transaction.usdt_address,
            'deposit_address': deposit_info['address'] if deposit_info else None,
            'deposit_private_key': deposit_info['private_key'] if deposit_info else None,
            'tron_txid': None,
            'status': 'pending'
        }
        
        logger.info("Saving transaction to Google Sheets...")
        result = sheets_db.create_transaction(transaction_data)
        logger.info(f"Transaction saved successfully with ID: {result['id']}")
        
        return TransactionResponse(
            id=result['id'],
            hash=result['hash'],
            type=result['type'],
            amount_usdt=result.get('amount_usdt'),
            amount_rub=result.get('amount_rub'),
            payment_method=result['payment_method'],
            status=result['status'],
            created_at=result['created_at'],
            deposit_address=result.get('deposit_address'),
            usdt_address=result.get('usdt_address')
        )
    except Exception as e:
        logger.error(f"Error saving transaction: {e}")
        logger.exception("Full traceback:")
        raise HTTPException(status_code=500, detail=f"Failed to create transaction: {str(e)}")

@router.get("/transactions", response_model=list[TransactionResponse])
def get_transactions():
    """Get all transactions - no auth required for now"""
    try:
        transactions = sheets_db.get_all_transactions()
        return transactions
    except Exception as e:
        logger.error(f"Error getting transactions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/transactions/{transaction_hash}")
def get_transaction_by_hash(transaction_hash: str):
    """Get transaction details by hash - no auth required"""
    try:
        tx = sheets_db.get_transaction_by_hash(transaction_hash)
        if not tx:
            raise HTTPException(status_code=404, detail="Transaction not found")
        return tx
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting transaction: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/transactions/{transaction_hash}/check")
def check_transaction_status(transaction_hash: str):
    """Manually check transaction status on blockchain"""
    try:
        tx = sheets_db.get_transaction_by_hash(transaction_hash)
        if not tx:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        if tx.get('type') == 'sell' and tx.get('deposit_address'):
            from decimal import Decimal
            result = tron_wallet.check_incoming_transaction(
                tx['deposit_address'],
                Decimal(str(tx['amount_usdt']))
            )
            
            if result.get('received'):
                sheets_db.update_transaction(tx['id'], {'status': 'confirming'})
                return {'status': 'confirming', 'message': 'Payment received, processing...'}
            else:
                return {'status': 'pending', 'message': 'Waiting for payment', 'balance': str(result.get('amount', 0))}
        
        return {'status': tx.get('status', 'pending')}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking transaction status: {e}")
        raise HTTPException(status_code=500, detail=str(e))