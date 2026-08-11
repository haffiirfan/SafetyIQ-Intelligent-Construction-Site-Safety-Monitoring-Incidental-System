from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.violation import Violation
from app.schemas.violation import ViolationCreate, ViolationUpdate, ViolationResponse
from typing import List, Optional

router = APIRouter(prefix="/violations", tags=["Violations"])

@router.get("/", response_model=List[ViolationResponse])
def get_violations(
    zone: Optional[str] = None,
    severity: Optional[str] = None,
    resolved: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Violation)
    if zone:
        query = query.filter(Violation.zone == zone)
    if severity:
        query = query.filter(Violation.severity == severity)
    if resolved is not None:
        query = query.filter(Violation.resolved == resolved)
    return query.order_by(Violation.created_at.desc()).all()

@router.post("/", response_model=ViolationResponse)
def create_violation(violation: ViolationCreate, db: Session = Depends(get_db)):
    new_violation = Violation(**violation.model_dump())
    db.add(new_violation)
    db.commit()
    db.refresh(new_violation)
    return new_violation

@router.put("/{violation_id}/resolve", response_model=ViolationResponse)
def resolve_violation(violation_id: int, db: Session = Depends(get_db)):
    violation = db.query(Violation).filter(Violation.id == violation_id).first()
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found")
    violation.resolved = True
    db.commit()
    db.refresh(violation)
    return violation

@router.get("/heatmap")
def get_heatmap(db: Session = Depends(get_db)):
    violations = db.query(Violation).all()
    heatmap = {}
    for v in violations:
        heatmap[v.zone] = heatmap.get(v.zone, 0) + 1
    return heatmap
