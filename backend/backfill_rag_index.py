"""
backfill_rag_index.py

One-time script to index violations that were created BEFORE the RAG
integration existed. Run this once from the backend/ directory:

    python backfill_rag_index.py

After this runs, every violation already in your database becomes
searchable via AI Safety Query. New violations going forward are
indexed automatically by detection_service.py — this script only
needs to run once (safe to re-run though, upsert overwrites cleanly).
"""

from app.db.session import SessionLocal
from app.models.violation import Violation
from app.services.rag_service import rag_service

def main():
    db = SessionLocal()
    try:
        violations = db.query(Violation).all()
        print(f"Found {len(violations)} violations to index...")

        if not violations:
            print("Nothing to index.")
            return

        count = rag_service.index_violations_bulk(violations)
        print(f"Indexed {count} violations into ChromaDB.")
    finally:
        db.close()

if __name__ == "__main__":
    main()
