from fastapi import WebSocket, WebSocketDisconnect
from app.ml.yolo_detector import detector
from app.services.detection_service import process_detections
import json
import asyncio

async def camera_stream(websocket: WebSocket, camera_id: int):
    await websocket.accept()
    print(f"WebSocket connected - Camera {camera_id}")

    try:
        while True:
            detections = detector.detect(None)

            violations = [
                d for d in detections
                if d['risk'] != 'None'
            ]

            # Log to database every 10 seconds to avoid spam
            # Change 5 to 1 for real-time logging
            if len(detections) > 0:
                await process_detections(
                    camera_id  = camera_id,
                    detections = detections,
                    zone       = f"Zone {camera_id}"
                )

            payload = {
                "camera_id":  camera_id,
                "detections": detections,
                "violations": violations,
                "frame":      None
            }

            await websocket.send_text(json.dumps(payload))
            await asyncio.sleep(10)  # 10 seconds between DB logs

    except WebSocketDisconnect:
        print(f"WebSocket disconnected - Camera {camera_id}")
    except Exception as e:
        print(f"WebSocket error: {e}")
        await websocket.close()