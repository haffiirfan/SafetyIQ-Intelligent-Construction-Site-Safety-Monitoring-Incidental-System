from fastapi import APIRouter
from app.schemas.query import QueryRequest, QueryResponse

router = APIRouter(prefix="/query", tags=["RAG Query"])

@router.post("/", response_model=QueryResponse)
async def query_rag(request: QueryRequest):
    # Placeholder — RAG engine connects here in Stage 4
    return QueryResponse(
        question=request.question,
        answer="RAG engine not connected yet. Coming in Stage 4.",
        sources=[]
    )
