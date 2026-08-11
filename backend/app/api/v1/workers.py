from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.worker import Worker
from app.models.violation import Violation
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/workers", tags=["Workers"])

class WorkerCreate(BaseModel):
    name: str
    department: Optional[str] = None

class WorkerResponse(BaseModel):
    id: int
    name: str
    department: Optional[str]
    violation_count: int

    class Config:
        from_attributes = True

@router.get("/", response_model=List[WorkerResponse])
def get_workers(db: Session = Depends(get_db)):
    return db.query(Worker).all()

@router.post("/", response_model=WorkerResponse)
def create_worker(worker: WorkerCreate, db: Session = Depends(get_db)):
    new_worker = Worker(**worker.model_dump())
    db.add(new_worker)
    db.commit()
    db.refresh(new_worker)
    return new_worker

@router.get("/{worker_id}", response_model=WorkerResponse)
def get_worker(worker_id: int, db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    return worker

@router.get("/{worker_id}/violations")
def get_worker_violations(worker_id: int, db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    violations = db.query(Violation).filter(
        Violation.worker_id == worker_id
    ).all()
    return {
        "worker": worker.name,
        "total_violations": worker.violation_count,
        "history": violations
    }

@router.delete("/{worker_id}")
def delete_worker(worker_id: int, db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    db.delete(worker)
    db.commit()
    return {"message": "Worker deleted"}
