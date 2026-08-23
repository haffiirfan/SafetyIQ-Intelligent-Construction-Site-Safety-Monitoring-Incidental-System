import os
import cv2
from typing import List, Dict

class YOLODetector:
    def __init__(self, model_path: str = None):
        self.model = None
        self.model_path = model_path
        self.video_path = None

        if model_path and os.path.exists(model_path):
            try:
                from ultralytics import YOLO
                self.model = YOLO(model_path)
                print(f"YOLO11 model loaded from {model_path}")
            except Exception as e:
                print(f"Failed to load model: {e}")
        else:
            print(f"WARNING: model file not found at {model_path} — detection will be empty")

    def set_video(self, video_path: str):
        self.video_path = video_path

    def detect(self, frame=None) -> List[Dict]:
        # No mock fallback — if there's no frame or no loaded model,
        # return no detections rather than fabricating data.
        if frame is None:
            return []
        if self.model is None:
            return []
        return self._real_detect(frame)

    def detect_from_video(self, video_path: str) -> List[Dict]:
        if not self.model:
            return []
        cap = cv2.VideoCapture(video_path)
        ret, frame = cap.read()
        cap.release()
        if ret:
            return self._real_detect(frame)
        return []

    def _real_detect(self, frame) -> List[Dict]:
        results = self.model(frame, conf=0.5, verbose=False)
        detections = []
        for r in results:
            for box in r.boxes:
                cls_name = self.model.names[int(box.cls)]
                detections.append({
                    "class":      cls_name,
                    "confidence": round(float(box.conf), 3),
                    "bbox":       box.xyxy[0].tolist(),
                    "risk":       self._get_risk(cls_name)
                })
        return detections

    def _get_risk(self, class_name: str) -> str:
        risk_map = {
            "NO-Hardhat":     "Critical",
            "NO-Safety Vest": "High",
            "NO-Mask":        "Medium",
            "NO-Gloves":      "Low",
        }
        return risk_map.get(class_name, "None")

detector = YOLODetector(model_path="../ml_training/models/best.pt")