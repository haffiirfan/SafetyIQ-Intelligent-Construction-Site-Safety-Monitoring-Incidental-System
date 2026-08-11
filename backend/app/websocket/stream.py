from fastapi import WebSocket, WebSocketDisconnect
from app.ml.yolo_detector import detector
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

            payload = {
                "camera_id":  camera_id,
                "detections": detections,
                "violations": violations,
                "frame":      None
            }

            await websocket.send_text(json.dumps(payload))
            await asyncio.sleep(2)

    except WebSocketDisconnect:
        print(f"WebSocket disconnected - Camera {camera_id}")
    except Exception as e:
        print(f"WebSocket error: {e}")
        await websocket.close()
