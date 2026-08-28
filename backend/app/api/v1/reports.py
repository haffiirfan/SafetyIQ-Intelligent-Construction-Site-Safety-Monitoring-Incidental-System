from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.report import IncidentReport
from app.models.violation import Violation
from app.schemas.report import ReportCreate, ReportResponse
from app.services.rag_service import rag_service
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/reports", tags=["Reports"])


class GenerateReportRequest(BaseModel):
    zone: Optional[str] = None
    risk_type: Optional[str] = None
    date: Optional[str] = None  # "YYYY-MM-DD" — filters which violations feed the report


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


@router.post("/generate", response_model=ReportResponse)
def generate_report(req: GenerateReportRequest, db: Session = Depends(get_db)):
    """Pick violations matching the given filters, ask the LLM to write
    a narrative incident report summarizing them, and persist the
    result as a real IncidentReport row — not just a throwaway answer."""
    query = db.query(Violation)
    if req.zone:
        query = query.filter(Violation.zone == req.zone)
    if req.risk_type:
        query = query.filter(Violation.risk_type == req.risk_type)

    violations = query.order_by(Violation.created_at.desc()).all()

    # date isn't a column filter here since created_at is a full timestamp —
    # filter in Python instead
    if req.date:
        violations = [
            v for v in violations
            if v.created_at and v.created_at.strftime("%Y-%m-%d") == req.date
        ]

    narrative = rag_service.generate_report(violations)

    new_report = IncidentReport(
        date=datetime.utcnow(),
        summary_text=narrative,
        risk_type=req.risk_type or "Mixed",
        generated_by="Qwen2.5-1.5B-Instruct",
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    return new_report