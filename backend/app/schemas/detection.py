# ══════════════════════════════════════════════
# schemas/detection.py
# ══════════════════════════════════════════════
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class DetectionCreate(BaseModel):
    camera_id: int
    label: str          # "Hardhat", "NO-Hardhat" etc
    confidence: float
    frame_path: Optional[str] = None

class DetectionResponse(BaseModel):
    id: int
    camera_id: int
    label: str
    confidence: float
    frame_path: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True