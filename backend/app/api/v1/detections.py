from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.detection import Detection
from app.schemas.detection import DetectionCreate, DetectionResponse
from typing import List, Optional

router = APIRouter(prefix="/detections", tags=["Detections"])

@router.get("/", response_model=List[DetectionResponse])
def get_detections(
    camera_id: Optional[int] = None,
    label: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Detection)
    if camera_id:
        query = query.filter(Detection.camera_id == camera_id)
    if label:
        query = query.filter(Detection.label == label)
    return query.order_by(Detection.timestamp.desc()).limit(100).all()

@router.post("/", response_model=DetectionResponse)
def create_detection(detection: DetectionCreate, db: Session = Depends(get_db)):
    new_detection = Detection(**detection.model_dump())
    db.add(new_detection)
    db.commit()
    db.refresh(new_detection)
    return new_detection

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    total = db.query(Detection).count()
    violations = db.query(Detection).filter(
        Detection.label.like("NO-%")
    ).count()
    return {
        "total_detections": total,
        "total_violations": violations,
        "compliance_rate": round((total - violations) / total * 100, 1) if total > 0 else 0
    }
