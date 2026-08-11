# ══════════════════════════════════════════════
# schemas/report.py
# ══════════════════════════════════════════════
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ReportCreate(BaseModel):
    date: datetime
    summary_text: str
    generated_by: str = "T5"

class ReportResponse(BaseModel):
    id: int
    date: datetime
    summary_text: str
    generated_by: str
    created_at: datetime

    class Config:
        from_attributes = True