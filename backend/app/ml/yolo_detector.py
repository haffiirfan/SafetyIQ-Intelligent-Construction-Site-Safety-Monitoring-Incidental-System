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
            print("No model found - using mock detector")

    def set_video(self, video_path: str):
        self.video_path = video_path

    def detect(self, frame=None) -> List[Dict]:
        if frame is not None and self.model:
            return self._real_detect(frame)
        return self._mock_detect()

    def detect_from_video(self, video_path: str) -> List[Dict]:
        if not self.model:
            return self._mock_detect()
        cap = cv2.VideoCapture(video_path)
        ret, frame = cap.read()
        cap.release()
        if ret:
            return self._real_detect(frame)
        return self._mock_detect()

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

    def _mock_detect(self) -> List[Dict]:
        return [
            {"class": "NO-Hardhat",     "confidence": 0.91,
             "bbox": [100,100,200,200], "risk": "Critical"},
            {"class": "NO-Safety Vest", "confidence": 0.87,
             "bbox": [150,150,250,300], "risk": "High"},
            {"class": "Hardhat",        "confidence": 0.95,
             "bbox": [300,100,400,200], "risk": "None"},
            {"class": "NO-Mask",        "confidence": 0.83,
             "bbox": [200,80,280,160],  "risk": "Medium"}
        ]

    def _get_risk(self, class_name: str) -> str:
        risk_map = {
            "NO-Hardhat":     "Critical",
            "NO-Safety Vest": "High",
            "NO-Mask":        "Medium",
            "NO-Gloves":      "Low",
        }
        return risk_map.get(class_name, "None")

detector = YOLODetector(model_path="../ml_training/models/best.pt")