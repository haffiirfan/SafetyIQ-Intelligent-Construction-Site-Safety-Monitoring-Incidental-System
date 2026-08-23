from fastapi import WebSocket, WebSocketDisconnect
from app.ml.yolo_detector import detector
from app.services.detection_service import process_detections
import cv2
import json
import asyncio
import os
import time

DEMO_VIDEOS = {
    1: "C:/Users/DELL/Desktop/SafetyIQ/temp_video/footage_1.mp4",
    2: "C:/Users/DELL/Desktop/SafetyIQ/temp_video/footage_2.mp4",
}

# Tracks the single active websocket per camera_id.
# If a new connection comes in for a camera that already has one,
# the old one is force-closed so its loop dies immediately instead
# of lingering as a "zombie" that keeps failing on send().
_active_connections = {}

async def camera_stream(websocket: WebSocket, camera_id: int):
    await websocket.accept()
    print(f"WebSocket connected - Camera {camera_id}")

    old_ws = _active_connections.get(camera_id)
    if old_ws is not None and old_ws is not websocket:
        try:
            await old_ws.close()
            print(f"Closed previous duplicate connection - Camera {camera_id}")
        except Exception:
            pass
    _active_connections[camera_id] = websocket

    video_path = DEMO_VIDEOS.get(camera_id)
    cap = None
    start_time = time.time()
    fps = 25
    frame_total = 0
    frame_pos = 0

    if video_path and os.path.exists(video_path):
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS) or 25
        frame_total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        print(f"Video loaded for YOLO inference | fps={fps} frame_total={frame_total}")
        if frame_total <= 1:
            print("WARNING: frame count looks invalid — video may not loop correctly")
    else:
        print(f"WARNING: video file not found at {video_path} — no frames to detect on")

    frame_count = 0
    last_detections = []  # no detections until real inference actually runs

    try:
        while True:
            # If a newer connection has taken over this camera_id,
            # stop this loop immediately instead of continuing to run.
            if _active_connections.get(camera_id) is not websocket:
                print(f"Superseded connection stopping - Camera {camera_id}")
                break

            if cap and cap.isOpened():
                ret, frame = False, None

                if frame_total > 1:
                    # Figure out which frame we SHOULD be on right now,
                    # based on real elapsed time — but get there by
                    # reading sequentially (reliable), never by seeking
                    # with CAP_PROP_POS_MSEC (unreliable on many mp4s,
                    # often silently fails and returns ret=False).
                    elapsed = time.time() - start_time
                    target_frame = int(elapsed * fps) % frame_total

                    if target_frame < frame_pos:
                        # video wrapped around — restart from frame 0
                        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                        frame_pos = 0

                    steps = target_frame - frame_pos
                    # cap how many frames we catch up on in one tick,
                    # so a slow tick doesn't stall the loop
                    steps = min(max(steps, 1), int(fps * 2))

                    for _ in range(steps):
                        ret, frame = cap.read()
                        frame_pos += 1
                        if not ret:
                            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                            frame_pos = 0
                            ret, frame = cap.read()
                            if ret:
                                frame_pos = 1
                            break
                else:
                    # Frame count unknown/invalid — just read sequentially
                    ret, frame = cap.read()
                    if not ret:
                        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                        ret, frame = cap.read()

                frame_count += 1
                if ret and frame is not None and frame_count % 2 == 0:
                    if detector.model is None:
                        print("WARNING: no model loaded — skipping inference")
                    else:
                        last_detections = detector.detect(frame)
                        if last_detections:
                            await process_detections(
                                camera_id=camera_id,
                                detections=last_detections,
                                zone=f"Zone {camera_id}"
                            )

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

            await asyncio.sleep(0.5)

    except WebSocketDisconnect:
        print(f"WebSocket disconnected - Camera {camera_id}")
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        if _active_connections.get(camera_id) is websocket:
            del _active_connections[camera_id]
        if cap:
            cap.release()