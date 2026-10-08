import threading
import time

import cv2

from .camera import Camera
from .detector import HumanDetector


class MLStream:
    def __init__(self, model_path: str):
        self.camera = Camera(
            camera_index=0,
            width=1280,
            height=720,
            fps=10,
        )

        self.detector = HumanDetector(
            model_path=model_path,
            confidence=0.35,
            image_size=640,
        )

        self.latest_frame = None
        self.latest_detections = []
        self.person_count = 0
        self.fps = 0.0

        self.running = False
        self.thread = None
        self.lock = threading.Lock()

    def start(self):
        if self.running:
            return

        self.camera.start()

        self.running = True

        self.thread = threading.Thread(
            target=self._process,
            daemon=True,
        )

        self.thread.start()

        print("RAKSHA ML stream started.")

    def _process(self):
        previous_time = time.time()

        while self.running:
            frame = self.camera.read()

            if frame is None:
                continue

            # YOLO inference
            result = self.detector.detect(frame)

            # OpenCV bounding boxes
            annotated_frame, detections = (
                self.detector.annotate(
                    frame,
                    result,
                )
            )

            person_count = len(detections)

            # Calculate FPS
            current_time = time.time()
            elapsed = current_time - previous_time

            if elapsed > 0:
                current_fps = 1.0 / elapsed
            else:
                current_fps = 0.0

            previous_time = current_time

            # RAKSHA overlay
            cv2.putText(
                annotated_frame,
                f"RAKSHA | PERSONS: {person_count}",
                (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.9,
                (0, 255, 0),
                2,
            )

            cv2.putText(
                annotated_frame,
                f"YOLO FPS: {current_fps:.1f}",
                (20, 80),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (0, 255, 0),
                2,
            )

            # Encode for HTTP streaming
            success, encoded = cv2.imencode(
                ".jpg",
                annotated_frame,
                [
                    cv2.IMWRITE_JPEG_QUALITY,
                    75,
                ],
            )

            if not success:
                continue

            frame_bytes = encoded.tobytes()

            with self.lock:
                self.latest_frame = frame_bytes
                self.latest_detections = detections
                self.person_count = person_count
                self.fps = current_fps

    def get_frame(self):
        with self.lock:
            return self.latest_frame

    def get_status(self):
        with self.lock:
            return {
                "status": "running" if self.running else "stopped",
                "person_count": self.person_count,
                "fps": round(self.fps, 2),
                "detections": self.latest_detections,
            }

    def stop(self):
        self.running = False

        if self.thread is not None:
            self.thread.join(timeout=2)

        self.camera.release()