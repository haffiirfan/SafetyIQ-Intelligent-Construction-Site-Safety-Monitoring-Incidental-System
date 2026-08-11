# ══════════════════════════════════════════════
# schemas/query.py
# ══════════════════════════════════════════════
from pydantic import BaseModel

class QueryRequest(BaseModel):
    question: str       # "Which zone had most violations?"

class QueryResponse(BaseModel):
    question: str
    answer: str
    sources: list[str] = []  # which reports were used