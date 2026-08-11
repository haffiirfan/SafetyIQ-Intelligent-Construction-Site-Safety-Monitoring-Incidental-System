# ══════════════════════════════════════════════
# schemas/camera.py
# ══════════════════════════════════════════════
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# ── What you send to CREATE a camera ──────────
class CameraCreate(BaseModel):
    name: str
    location: str
    zone: str
    stream_url: Optional[str] = None

# ── What you send to UPDATE a camera ──────────
class CameraUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    zone: Optional[str] = None
    stream_url: Optional[str] = None
    is_active: Optional[bool] = None

# ── What API sends BACK to you ─────────────────
class CameraResponse(BaseModel):
    id: int
    name: str
    location: str
    zone: str
    stream_url: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True