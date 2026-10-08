from pathlib import Path

from ultralytics import YOLO


class HumanDetector:
    PERSON_CLASS_ID = 0

    def __init__(
        self,
        model_path: str,
        confidence: float = 0.35,
        image_size: int = 640,
    ):
        model_path = Path(model_path) # type: ignore

        print(f"Loading YOLO model: {model_path}")

        self.model = YOLO(str(model_path))
        self.confidence = confidence
        self.image_size = image_size

        print("YOLO model loaded successfully.")

    def detect(self, frame):
        results = self.model.predict(
            source=frame,
            classes=[self.PERSON_CLASS_ID],
            conf=self.confidence,
            imgsz=self.image_size,
            verbose=False,
        )

        return results[0] # type: ignore

    def annotate(self, frame, result):
        annotated = frame.copy()

        if result.boxes is None:
            return annotated, []

        detections = []

        for box in result.boxes:
            xyxy = box.xyxy[0].tolist()
            confidence = float(box.conf[0].item())

            x1, y1, x2, y2 = map(int, xyxy)

            # OpenCV bounding box
            import cv2

            cv2.rectangle(
                annotated,
                (x1, y1),
                (x2, y2),
                (0, 255, 0),
                2,
            )

            label = f"PERSON {confidence:.2f}"

            cv2.putText(
                annotated,
                label,
                (x1, max(y1 - 10, 20)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 255, 0),
                2,
            )

            detections.append(
                {
                    "class_name": "person",
                    "confidence": confidence,
                    "bbox": {
                        "x1": x1,
                        "y1": y1,
                        "x2": x2,
                        "y2": y2,
                    },
                }
            )

        return annotated, detections