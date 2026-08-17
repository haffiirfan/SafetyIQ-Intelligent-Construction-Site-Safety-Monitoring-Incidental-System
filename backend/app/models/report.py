from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.db.session import Base

class IncidentReport(Base):
    __tablename__ = "incident_reports"
    id           = Column(Integer, primary_key=True, index=True)
    date         = Column(DateTime(timezone=True))
    summary_text = Column(Text)
    risk_type =    Column(String)  # "NO-Hardhat", "NO-Safety Vest" etc
    generated_by = Column(String, default="T5")
    created_at   = Column(DateTime(timezone=True), server_default=func.now())