import threading
import time
from contextlib import asynccontextmanager
from pathlib import Path

import cv2
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from .camera import Camera
from .detector import HumanDetector


class MLStream:

    def __init__(self, model_path: str):

        self.camera = Camera(
            camera_index=0,
            width=640,
            height=480,
            fps=15,
        )

        self.detector = HumanDetector(
            model_path=model_path,
            confidence=0.25,
            image_size=416,
        )

        self.latest_frame = None
        self.latest_detections = []

        self.person_count = 0
        self.fps = 0.0

        # Detection stabilization
        self.last_valid_detections = []
        self.last_detection_time = 0.0

        # Keep detection visible for this long when YOLO
        # temporarily misses a frame.
        self.detection_hold_seconds = 0.8

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

            # -----------------------------
            # YOLO inference
            # -----------------------------

            result = self.detector.detect(frame)

            annotated_frame, detections = (
                self.detector.annotate(
                    frame,
                    result,
                )
            )

            now = time.time()

            # -----------------------------
            # Detection stabilization
            # -----------------------------

            if len(detections) > 0:

                # Fresh detection
                self.last_valid_detections = detections
                self.last_detection_time = now

                stable_detections = detections

            else:

                # Temporarily keep previous detection
                if (
                    len(self.last_valid_detections) > 0
                    and
                    now - self.last_detection_time
                    < self.detection_hold_seconds
                ):

                    stable_detections = (
                        self.last_valid_detections
                    )

                else:

                    # Person genuinely gone
                    stable_detections = []

                    self.last_valid_detections = []

            person_count = len(stable_detections)

            # -----------------------------
            # FPS
            # -----------------------------

            elapsed = now - previous_time

            if elapsed > 0:
                current_fps = 1.0 / elapsed
            else:
                current_fps = 0.0

            previous_time = now

            # -----------------------------
            # Overlay
            # -----------------------------

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

            # -----------------------------
            # JPEG
            # -----------------------------

            success, encoded = cv2.imencode(
                ".jpg",
                annotated_frame,
                [
                    cv2.IMWRITE_JPEG_QUALITY,
                    70,
                ],
            )

            if not success:
                continue

            frame_bytes = encoded.tobytes()

            with self.lock:

                self.latest_frame = frame_bytes
                self.latest_detections = stable_detections
                self.person_count = person_count
                self.fps = current_fps

    def get_frame(self):

        with self.lock:
            return self.latest_frame

    def get_status(self):

        with self.lock:

            return {
                "status": (
                    "running"
                    if self.running
                    else "stopped"
                ),
                "person_count": self.person_count,
                "fps": round(self.fps, 2),
                "detections": self.latest_detections,
            }

    def stop(self):

        self.running = False

        if self.thread is not None:
            self.thread.join(timeout=2)

        self.camera.release()


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "yolo26n.pt"
ml_stream = MLStream(model_path=str(MODEL_PATH))


@asynccontextmanager
async def lifespan(_app: FastAPI):
    ml_stream.start()
    try:
        yield
    finally:
        ml_stream.stop()


app = FastAPI(title="RAKSHA Local Laptop ML Service", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return ml_stream.get_status()


def generate_video():
    while ml_stream.running:
        frame = ml_stream.get_frame()
        if frame is None:
            time.sleep(0.01)
            continue
        yield b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + frame + b"\r\n"


@app.get("/video")
def video():
    return StreamingResponse(
        generate_video(),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )


@app.get("/detections")
def detections():
    return ml_stream.get_status()
