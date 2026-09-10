# backend/app/services/detection_service.py
from datetime import datetime
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

# Deduplication now checks the DATABASE directly, not an in-memory
# set. An in-memory set gets wiped every time the server restarts or
# auto-reloads (which happens constantly during development), which
# let already-logged violations get re-logged after every reload.
# Checking the database instead makes "already logged" permanent —
# it survives restarts, reloads, everything — until you explicitly
# reset the database yourself.
def _already_logged_in_db(db, camera_id: int, label: str) -> bool:
    existing = db.query(Detection).filter(
        Detection.camera_id == camera_id,
        Detection.label == label,
    ).first()
    return existing is not None


async def process_detections(camera_id: int, detections: list, zone: str = "Zone A"):
    db = SessionLocal()
    try:
        for d in detections:
            label = d['class']

            # Skip if this exact (camera, label) is already in the
            # database — permanent, survives restarts, unlike the old
            # in-memory version.
            if _already_logged_in_db(db, camera_id, label):
                continue

            detection = Detection(
                camera_id  = camera_id,
                label      = label,
                confidence = d['confidence'],
                frame_path = None
            )
            db.add(detection)
            db.commit()
            db.refresh(detection)

            if label in VIOLATION_CLASSES:
                severity = SEVERITY_MAP.get(label, "Low")

                violation = Violation(
                    detection_id = detection.id,
                    zone         = zone,
                    severity     = severity,
                    risk_type    = label,
                    resolved     = False
                )
                db.add(violation)
                db.commit()
                db.refresh(violation)

                try:
                    rag_service.index_violation(violation)
                except Exception as e:
                    print(f"RAG indexing failed for violation {violation.id}: {e}")

                if severity == "Critical":
                    await alert_service.send_violation_alert(
                        violation_type = label,
                        zone           = zone,
                        confidence     = d['confidence'],
                        camera_id      = camera_id
                    )
    finally:
        db.close()