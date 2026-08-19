from fastapi import WebSocket, WebSocketDisconnect
from app.ml.yolo_detector import detector
from app.services.detection_service import process_detections
import cv2
import base64
import json
import asyncio
import os

DEMO_VIDEOS = {
    1: "../../../../temp_video/footage_1.mp4",
    2: "../../../../temp_video/footage_1.mp4",
}

COLORS = {
    'Critical': (0, 0, 255),
    'High':     (0, 165, 255),
    'Medium':   (0, 255, 255),
    'Low':      (255, 0, 0),
    'None':     (0, 255, 0),
}

async def camera_stream(websocket: WebSocket, camera_id: int):
    await websocket.accept()
    print(f"WebSocket connected - Camera {camera_id}")

    video_path = DEMO_VIDEOS.get(camera_id)
    cap = None

    if video_path and os.path.exists(video_path):
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS) or 30
        print(f"Video FPS: {fps}")
    else:
        print(f"No video found - using mock")
        fps = 30

    frame_count = 0
    yolo_interval = 15  # run YOLO every 15 frames
    last_detections = detector._mock_detect()

    try:
        while True:
            frame = None
            frame_b64 = None

            if cap and cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    ret, frame = cap.read()

            # Run YOLO every 15 frames only
            frame_count += 1
            if frame is not None and detector.model:
                if frame_count % yolo_interval == 0:
                    last_detections = detector.detect(frame)

            detections = last_detections

            # Draw bounding boxes on frame
            if frame is not None and len(detections) > 0:
                for d in detections:
                    if 'bbox' in d and d['bbox']:
                        x1,y1,x2,y2 = [int(x) for x in d['bbox']]
                        color = COLORS.get(d['risk'], (255,255,255))
                        cv2.rectangle(frame,(x1,y1),(x2,y2),color,2)
                        label = f"{d['class']} {int(d['confidence']*100)}%"
                        cv2.putText(frame, label, (x1, max(y1-8,10)),
                                   cv2.FONT_HERSHEY_SIMPLEX,
                                   0.5, color, 2)

            # Encode frame
            if frame is not None:
                _, buffer = cv2.imencode('.jpg', frame,
                            [cv2.IMWRITE_JPEG_QUALITY, 60])
                frame_b64 = base64.b64encode(
                    buffer).decode('utf-8')

            violations = [d for d in detections if d['risk'] != 'None']

            # Log to DB every 150 frames
            if frame_count % 150 == 0 and len(violations) > 0:
                await process_detections(
                    camera_id  = camera_id,
                    detections = violations,
                    zone       = f"Zone {camera_id}"
                )

            payload = {
                "camera_id":  camera_id,
                "detections": detections,
                "violations": violations,
                "frame":      frame_b64
            }

            await websocket.send_text(json.dumps(payload))
            await asyncio.sleep(1/fps)

    except WebSocketDisconnect:
        print(f"WebSocket disconnected - Camera {camera_id}")
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        if cap:
            cap.release()
        await websocket.close()