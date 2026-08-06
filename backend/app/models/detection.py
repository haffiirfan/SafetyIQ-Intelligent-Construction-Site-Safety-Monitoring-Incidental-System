from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.session import Base

class Detection(Base):
    __tablename__ = "detections"
    id         = Column(Integer, primary_key=True, index=True)
    camera_id  = Column(Integer, ForeignKey("cameras.id"))
    label      = Column(String)
    confidence = Column(Float)
    frame_path = Column(String)
    timestamp  = Column(DateTime(timezone=True), server_default=func.now())