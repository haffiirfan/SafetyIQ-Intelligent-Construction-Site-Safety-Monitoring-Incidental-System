from fastapi import APIRouter
from pydantic import BaseModel
from app.services.rag_service import rag_service

router = APIRouter(prefix="/query")


class QueryRequest(BaseModel):
    question: str


@router.post("/")
def ask_question(req: QueryRequest):
    result = rag_service.query(req.question)
    return result
