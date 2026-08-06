from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.db.session import Base

class Worker(Base):
    __tablename__ = "workers"
    id              = Column(Integer, primary_key=True, index=True)
    name            = Column(String, nullable=False)
    department      = Column(String)
    violation_count = Column(Integer, default=0)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())