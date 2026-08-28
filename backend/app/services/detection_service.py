# backend/app/services/detection_service.py
from app.models.detection import Detection
from app.models.violation import Violation
from app.db.session import SessionLocal
from app.services.alert_service import alert_service
from app.services.rag_service import rag_service

VIOLATION_CLASSES = ["NO-Hardhat", "NO-Safety Vest", "NO-Mask", "NO-Gloves"]

SEVERITY_MAP = {
    "NO-Hardhat":     "Critical",
    "NO-Safety Vest": "High",
    "NO-Mask":        "Medium",
    "NO-Gloves":      "Low",
}

async def process_detections(camera_id: int, detections: list, zone: str = "Zone A"):
    db = SessionLocal()
    try:
        for d in detections:
            # Save every detection to database
            detection = Detection(
                camera_id  = camera_id,
                label      = d['class'],
                confidence = d['confidence'],
                frame_path = None
            )
            db.add(detection)
            db.commit()
            db.refresh(detection)

            # If it's a violation — create violation record
            if d['class'] in VIOLATION_CLASSES:
                severity = SEVERITY_MAP.get(d['class'], "Low")

                violation = Violation(
                    detection_id = detection.id,
                    zone         = zone,
                    severity     = severity,
                    risk_type    = d['class'],
                    resolved     = False
                )
                db.add(violation)
                db.commit()
                db.refresh(violation)

                # Index into the RAG vector store so AI Safety Query
                # can find this violation immediately. Wrapped in a
                # try/except so an embedding failure never breaks the
                # core detection pipeline.
                try:
                    rag_service.index_violation(violation)
                except Exception as e:
                    print(f"RAG indexing failed for violation {violation.id}: {e}")

                # Send email for Critical violations
                if severity == "Critical":
                    await alert_service.send_violation_alert(
                        violation_type = d['class'],
                        zone           = zone,
                        confidence     = d['confidence'],
                        camera_id      = camera_id
                    )
    finally:
        db.close()