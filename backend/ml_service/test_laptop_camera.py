import cv2
from pathlib import Path

from detector import HumanDetector


# --------------------------------------------------
# MODEL
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent

MODEL_PATH = BASE_DIR / "models" / "yolo26n.pt"

detector = HumanDetector(
    model_path=str(MODEL_PATH),
    confidence=0.35,
    image_size=640,
)


# --------------------------------------------------
# CAMERA
# --------------------------------------------------

camera = cv2.VideoCapture(0)

if not camera.isOpened():
    raise RuntimeError("Could not open laptop camera.")

camera.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

print("Laptop camera opened.")
print("Press Q to quit.")


# --------------------------------------------------
# LIVE DETECTION
# --------------------------------------------------

while True:

    success, frame = camera.read()

    if not success:
        print("Could not read camera frame.")
        break

    # YOLO detection
    result = detector.detect(frame)

    # OpenCV bounding boxes
    annotated_frame, detections = detector.annotate(
        frame,
        result,
    )

    # Person count
    person_count = len(detections)

    # Overlay
    cv2.putText(
        annotated_frame,
        f"RAKSHA | PERSONS: {person_count}",
        (20, 40),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.9,
        (0, 255, 0),
        2,
    )

    # Show frame
    cv2.imshow(
        "RAKSHA - YOLO26n Human Detection",
        annotated_frame,
    )

    # Q = quit
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break


# --------------------------------------------------
# CLEANUP
# --------------------------------------------------

camera.release()
cv2.destroyAllWindows()

print("Camera released.")