import cv2


class Camera:
    def __init__(
        self,
        camera_index: int = 0,
        width: int = 1280,
        height: int = 720,
        fps: int = 10,
    ):
        self.camera_index = camera_index
        self.width = width
        self.height = height
        self.fps = fps
        self.capture = None

    def start(self):
        if self.capture is not None:
            return

        print("Opening USB camera...")

        self.capture = cv2.VideoCapture(
            self.camera_index,
            cv2.CAP_V4L2,
        )

        if not self.capture.isOpened():
            self.capture = None
            raise RuntimeError("Could not open USB camera.")

        self.capture.set(
            cv2.CAP_PROP_FRAME_WIDTH,
            self.width,
        )

        self.capture.set(
            cv2.CAP_PROP_FRAME_HEIGHT,
            self.height,
        )

        self.capture.set(
            cv2.CAP_PROP_FPS,
            self.fps,
        )

        print(
            f"Camera opened: "
            f"{int(self.capture.get(cv2.CAP_PROP_FRAME_WIDTH))}x"
            f"{int(self.capture.get(cv2.CAP_PROP_FRAME_HEIGHT))}"
        )

    def read(self):
        if self.capture is None:
            self.start()

        assert self.capture is not None
        success, frame = self.capture.read()

        if not success:
            return None

        return frame

    def release(self):
        if self.capture is not None:
            self.capture.release()
            self.capture = None