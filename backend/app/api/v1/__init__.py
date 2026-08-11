from fastapi import APIRouter
from app.api.v1 import auth, cameras, detections, violations, reports, query, workers

router = APIRouter()
router.include_router(auth.router)
router.include_router(cameras.router)
router.include_router(detections.router)
router.include_router(violations.router)
router.include_router(workers.router)
router.include_router(reports.router)
router.include_router(query.router)
