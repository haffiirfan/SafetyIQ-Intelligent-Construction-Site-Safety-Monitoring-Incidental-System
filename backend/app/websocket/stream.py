from fastapi import WebSocket, WebSocketDisconnect
from app.ml.yolo_detector import detector
import cv2
import json
import asyncio
import os

DEMO_VIDEOS = {
    1: "C:/Users/DELL/Desktop/SafetyIQ/temp_video/footage_1.mp4",
    2: "C:/Users/DELL/Desktop/SafetyIQ/temp_video/footage_2.mp4",
}

async def camera_stream(websocket: WebSocket, camera_id: int):
    await websocket.accept()
    print(f"WebSocket connected - Camera {camera_id}")

    video_path = DEMO_VIDEOS.get(camera_id)
    cap = None

    if video_path and os.path.exists(video_path):
        cap = cv2.VideoCapture(video_path)
        print(f"Video loaded for YOLO inference")
    else:
        print(f"No video - mock detections")

    frame_count = 0
    last_detections = detector._mock_detect()

    try:
        while True:
            # Read frame for YOLO only — not for streaming
            if cap and cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    ret, frame = cap.read()

                # Run YOLO every 15 frames
                frame_count += 1
                if frame_count % 15 == 0 and detector.model:
                    last_detections = detector.detect(frame)

            detections = last_detections
            violations = [d for d in detections if d['risk'] != 'None']

            payload = {
                "camera_id":  camera_id,
                "detections": detections,
                "violations": violations,
                "frame":      None  # React plays video natively
            }

            try:
                await websocket.send_text(json.dumps(payload))
            except Exception:
                break

            await asyncio.sleep(0.5)  # send detections every 0.5s

    except WebSocketDisconnect:
        print(f"WebSocket disconnected - Camera {camera_id}")
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        if cap:
            cap.release()