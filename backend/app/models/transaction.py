from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    hash = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    type = Column(String)  # 'sell' or 'buy'
    amount_usdt = Column(Float, nullable=True)
    amount_rub = Column(Float, nullable=True)
    payment_method = Column(String)  # 'card' or 'bank'
    phone_number = Column(String, nullable=True)
    bank_name = Column(String, nullable=True)
    card_number = Column(String, nullable=True)
    usdt_address = Column(String, nullable=True)  # User's USDT address (for buy) or deposit address (for sell)
    deposit_address = Column(String, nullable=True)  # Generated deposit address for sell transactions
    deposit_private_key = Column(String, nullable=True)  # Private key for deposit address (encrypted in production)
    tron_txid = Column(String, nullable=True)  # Tron transaction ID
    status = Column(String, default="pending")  # pending, confirming, completed, failed
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="transactions")