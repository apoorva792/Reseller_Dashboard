from sqlalchemy import Column, Integer, String, DateTime, DECIMAL, ForeignKey, Text
from sqlalchemy.orm import relationship
from database.database import Base
from sqlalchemy.sql import func
#Deployment comment
class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    customer_id = Column(Integer, ForeignKey("customers.customers_id"))
    amount = Column(DECIMAL(10, 2), nullable=False)
    transaction_type = Column(String(20), nullable=False)  # "add" or "subtract"
    description = Column(Text, nullable=True)
    balance_before = Column(DECIMAL(10, 2), nullable=False)
    balance_after = Column(DECIMAL(10, 2), nullable=False)
    created_at = Column(DateTime, default=func.now())
    
    # Relationship with the customer
    customer = relationship("Customer", foreign_keys=[customer_id])
    
    def __repr__(self):
        return f"<WalletTransaction(id={self.id}, customer_id={self.customer_id}, amount={self.amount}, type={self.transaction_type})>" 
