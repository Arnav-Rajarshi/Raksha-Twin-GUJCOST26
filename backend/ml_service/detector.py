
from pathlib import Path
import math
import cv2
from ultralytics import YOLO


class HumanDetector:
    PERSON_CLASS_ID = 0

    def __init__(
        self,
        model_path: str,
        confidence: float = 0.25,
        image_size: int = 416,
    ):
        model_path = Path(model_path) # type: ignore

        print(f"Loading YOLO pose model: {model_path}")

        self.model = YOLO(str(model_path))
        self.confidence = confidence
        self.image_size = image_size

        print("YOLO pose model loaded successfully.")

    @staticmethod
    def distance(p1, p2):
        return math.sqrt(
            (p1[0] - p2[0]) ** 2 +
            (p1[1] - p2[1]) ** 2
        )

    @staticmethod
    def valid_point(p):
        return p[0] > 0 and p[1] > 0

    def detect(self, frame):
        results = self.model.predict(
            source=frame,
            classes=[0],
            conf=self.confidence,
            imgsz=self.image_size,
            verbose=False,
        )

        return results[0] # type: ignore

    def annotate(self, frame, result):
        annotated = frame.copy()
        detections = []

        if result.boxes is None:
            return annotated, detections

        keypoints = None

        if result.keypoints is not None:
            keypoints = result.keypoints.xy.cpu().numpy()

        for i, box in enumerate(result.boxes):

            confidence = float(box.conf[0].item())

            if confidence < self.confidence:
                continue

            x1, y1, x2, y2 = map(
                int,
                box.xyxy[0].tolist()
            )

            status = "UNKNOWN"
            ratio = None

            # -------------------------------------------------
            # POSE CLASSIFICATION
            # -------------------------------------------------

            if keypoints is not None and i < len(keypoints):

                person = keypoints[i]

                left_shoulder = person[5]
                right_shoulder = person[6]
                left_hip = person[11]
                right_hip = person[12]

                points_valid = all([
                    self.valid_point(left_shoulder),
                    self.valid_point(right_shoulder),
                    self.valid_point(left_hip),
                    self.valid_point(right_hip),
                ])

                if points_valid:

                    shoulder_x = (
                        left_shoulder[0] +
                        right_shoulder[0]
                    ) / 2

                    shoulder_y = (
                        left_shoulder[1] +
                        right_shoulder[1]
                    ) / 2

                    hip_x = (
                        left_hip[0] +
                        right_hip[0]
                    ) / 2

                    hip_y = (
                        left_hip[1] +
                        right_hip[1]
                    ) / 2

                    shoulder_width = self.distance(
                        left_shoulder,
                        right_shoulder,
                    )

                    body_length = self.distance(
                        (shoulder_x, shoulder_y),
                        (hip_x, hip_y),
                    )

                    if shoulder_width > 10:

                        ratio = body_length / shoulder_width

                        if ratio < 0.90:
                            status = "POSSIBLY INJURED / LYING"

                        elif ratio > 1.25:
                            status = "GOOD / STANDING"

                        else:
                            status = "UNKNOWN"

                        # Draw shoulders
                        for point in [
                            left_shoulder,
                            right_shoulder,
                            left_hip,
                            right_hip,
                        ]:
                            px, py = map(int, point)

                            cv2.circle(
                                annotated,
                                (px, py),
                                4,
                                (255, 0, 0),
                                -1,
                            )

                        # Body axis
                        cv2.line(
                            annotated,
                            (int(shoulder_x), int(shoulder_y)),
                            (int(hip_x), int(hip_y)),
                            (255, 255, 0),
                            2,
                        )

            # -------------------------------------------------
            # ALWAYS KEEP PERSON DETECTION
            # -------------------------------------------------

            cv2.rectangle(
                annotated,
                (x1, y1),
                (x2, y2),
                (0, 255, 0),
                2,
            )

            cv2.putText(
                annotated,
                f"PERSON {confidence:.2f}",
                (x1, max(y1 - 35, 20)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.55,
                (0, 255, 0),
                2,
            )

            cv2.putText(
                annotated,
                status,
                (x1, max(y1 - 10, 40)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.55,
                (0, 255, 255),
                2,
            )

            detections.append({
                "class_name": "person",
                "confidence": round(confidence, 3),
                "status": status,
                "posture_ratio": (
                    round(ratio, 3)
                    if ratio is not None
                    else None
                ),
                "bbox": {
                    "x1": x1,
                    "y1": y1,
                    "x2": x2,
                    "y2": y2,
                },
            })

        return annotated, detections
