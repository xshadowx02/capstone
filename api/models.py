from sqlalchemy import Column, Integer, String, Numeric, Date, Boolean, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from database import Base


class Cardholder(Base):
    __tablename__ = "cardholders"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    card_number = Column(String(20), nullable=False)
    credit_limit = Column(Numeric(12, 2), default=100000.00)
    location = Column(String(255), default="Makati, Metro Manila")
    created_at = Column(DateTime, server_default=func.now())


class StatementLine(Base):
    __tablename__ = "statement_lines"
    id = Column(Integer, primary_key=True, index=True)
    cardholder_id = Column(Integer, ForeignKey("cardholders.id"))
    transaction_date = Column(Date, nullable=False)
    merchant_name = Column(String(255), nullable=False)
    merchant_category_code = Column(String(10))
    amount = Column(Numeric(12, 2), nullable=False)
    description = Column(Text)
    raw_text = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())


class Categorization(Base):
    __tablename__ = "categorizations"
    id = Column(Integer, primary_key=True, index=True)
    statement_line_id = Column(Integer, ForeignKey("statement_lines.id"))
    category = Column(String(100), nullable=False)
    subcategory = Column(String(100))
    confidence = Column(Numeric(5, 4), default=0.0)
    reasoning = Column(Text)
    rag_context = Column(Text)
    guardrail_passed = Column(Boolean, default=True)
    guardrail_flags = Column(Text)
    eval_score = Column(Numeric(5, 4))
    eval_feedback = Column(Text)
    model_used = Column(String(100))
    created_at = Column(DateTime, server_default=func.now())


class BudgetSetting(Base):
    __tablename__ = "budget_settings"
    id = Column(Integer, primary_key=True, index=True)
    cardholder_id = Column(Integer, ForeignKey("cardholders.id"))
    category = Column(String(100), nullable=False)
    monthly_limit = Column(Numeric(12, 2), nullable=False)
    created_at = Column(DateTime, server_default=func.now())


class StoreVisit(Base):
    __tablename__ = "store_visits"
    id = Column(Integer, primary_key=True, index=True)
    cardholder_id = Column(Integer, ForeignKey("cardholders.id"))
    merchant_name = Column(String(255), nullable=False)
    visit_count = Column(Integer, default=1)
    total_spent = Column(Numeric(12, 2), default=0.00)
    last_visit = Column(Date)
