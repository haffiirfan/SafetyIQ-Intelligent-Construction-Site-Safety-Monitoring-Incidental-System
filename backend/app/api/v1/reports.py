from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.report import IncidentReport
from app.schemas.report import ReportCreate, ReportResponse
from typing import List

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/", response_model=List[ReportResponse])
def get_reports(db: Session = Depends(get_db)):
    return db.query(IncidentReport).order_by(
        IncidentReport.created_at.desc()
    ).all()

@router.get("/{report_id}", response_model=ReportResponse)
def get_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(IncidentReport).filter(
        IncidentReport.id == report_id
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

@router.post("/", response_model=ReportResponse)
def create_report(report: ReportCreate, db: Session = Depends(get_db)):
    new_report = IncidentReport(**report.model_dump())
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    return new_report
