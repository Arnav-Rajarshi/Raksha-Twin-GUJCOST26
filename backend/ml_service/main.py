import time
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import StreamingResponse

from .stream import MLStream


BASE_DIR = Path(__file__).resolve().parent

MODEL_PATH = BASE_DIR / "models" / "yolo26n.pt"


app = FastAPI(
    title="RAKSHA ML Service",
    version="1.0.0",
)


ml_stream = MLStream(
    model_path=str(MODEL_PATH)
)


@app.on_event("startup")
def startup():
    print("Starting RAKSHA ML Service...")
    ml_stream.start()


@app.on_event("shutdown")
def shutdown():
    print("Stopping RAKSHA ML Service...")
    ml_stream.stop()


@app.get("/")
def root():
    return {
        "service": "RAKSHA ML Service",
        "status": "running",
        "model": "YOLO26n",
        "detection": "person",
    }


@app.get("/health")
def health():
    return ml_stream.get_status()


def generate_video():
    while True:
        frame = ml_stream.get_frame()

        if frame is None:
            time.sleep(0.01)
            continue

        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n"
            + frame
            + b"\r\n"
        )


@app.get("/video")
def video():
    return StreamingResponse(
        generate_video(),
        media_type=(
            "multipart/x-mixed-replace; "
            "boundary=frame"
        ),
    )


@app.get("/detections")
def detections():
    return ml_stream.get_status()