# ══════════════════════════════════════════════
# schemas/violation.py
# ══════════════════════════════════════════════
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ViolationCreate(BaseModel):
    detection_id: int
    zone: str
    severity: str       # "Critical", "High", "Medium"
    risk_type: str      # "NO-Hardhat", "NO-Safety Vest" etc
    notes: Optional[str] = None

class ViolationUpdate(BaseModel):
    resolved: Optional[bool] = None
    notes: Optional[str] = None

class ViolationResponse(BaseModel):
    id: int
    detection_id: int
    zone: str
    severity: str
    risk_type: str
    resolved: bool
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True