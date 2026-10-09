import serial
import requests
import re
from datetime import datetime, timezone


# ============================================================
# CONFIGURATION
# ============================================================

SERIAL_PORT = "COM13"
BAUD_RATE = 115200

# IMPORTANT:
# Replace this with the EXISTING sensor POST endpoint
# from your backend.
#
# Example:
# BACKEND_URL = "http://127.0.0.1:8000/api/sensors"
#
# OR if deployed:
# BACKEND_URL = "https://your-backend.onrender.com/api/sensors"

BACKEND_URL = "http://127.0.0.1:8000/sensors"


# These MUST match the robot and mission
# that your dashboard is currently using.

ROBOT_ID = "RT001"
MISSION_ID = "MI007"


# ============================================================
# SERIAL CONNECTION
# ============================================================

ser = serial.Serial(
    port=SERIAL_PORT,
    baudrate=BAUD_RATE,
    timeout=1
)

print("=" * 60)
print("RAKSHA SENSOR SERIAL GATEWAY")
print("=" * 60)
print(f"Serial Port : {SERIAL_PORT}")
print(f"Baud Rate   : {BAUD_RATE}")
print(f"Backend     : {BACKEND_URL}")
print(f"Robot ID    : {ROBOT_ID}")
print(f"Mission ID  : {MISSION_ID}")
print("=" * 60)

print("Waiting for receiver data...\n")


# ============================================================
# PARSE ESP32 SERIAL OUTPUT
# ============================================================

def parse_telemetry(line: str):

    pattern = (
        r"PACKET:\s*(\d+)"
        r"\s*\|\s*TEMP:\s*([-+]?\d+(?:\.\d+)?)\s*C"
        r"\s*\|\s*HUM:\s*([-+]?\d+(?:\.\d+)?)\s*%"
        r"\s*\|\s*GAS:\s*(\d+)"
    )

    match = re.search(pattern, line)

    if not match:
        return None

    packet_id = int(match.group(1))
    temperature = float(match.group(2))
    humidity = float(match.group(3))
    gas = int(match.group(4))

    # --------------------------------------------------------
    # IMPORTANT:
    #
    # packet_id is received from the ESP32 but is currently
    # NOT part of your SensorReading model.
    #
    # Therefore we don't send it to the backend.
    # --------------------------------------------------------

    sensor_reading = {

        "robot_id": ROBOT_ID,

        "mission_id": MISSION_ID,

        "timestamp": datetime.now(
            timezone.utc
        ).isoformat(),

        "temperature": temperature,

        "humidity": humidity,

        "gas": {
            "sensor_id": "GAS-01",
            "value": gas,
            "unit": "ppm"
        },

        # Your current receiver does not provide range data.
        #
        # SensorReading requires the range field, so we provide
        # a safe "not available" value.
        #
        # This does NOT mean the robot actually measured 0m.
        "range": {
            "front": 0
        }
    }

    return sensor_reading


# ============================================================
# SEND TO EXISTING SENSOR ENDPOINT
# ============================================================

def send_to_backend(sensor_reading):

    try:

        response = requests.post(
            BACKEND_URL,
            json=sensor_reading,
            timeout=5
        )

        if response.ok:

            print(
                f"[BACKEND] "
                f"SUCCESS {response.status_code}"
            )

            print(
                f"[BACKEND] "
                f"{response.text}"
            )

        else:

            print(
                f"[BACKEND] "
                f"ERROR {response.status_code}"
            )

            print(
                f"[BACKEND] "
                f"{response.text}"
            )

    except requests.RequestException as e:

        print(
            f"[BACKEND] "
            f"CONNECTION ERROR: {e}"
        )


# ============================================================
# MAIN LOOP
# ============================================================

try:

    while True:

        line = ser.readline().decode(
            "utf-8",
            errors="ignore"
        ).strip()

        if not line:
            continue

        # Show exactly what came from ESP32
        print(f"[SERIAL] {line}")

        sensor_reading = parse_telemetry(line)

        # Ignore:
        # SENSOR RECEIVER READY
        # NRF24 NOT FOUND
        # etc.
        if sensor_reading is None:
            continue

        print("[PARSED SENSOR READING]")

        print(sensor_reading)

        send_to_backend(sensor_reading)

        print()


except KeyboardInterrupt:

    print("\nStopping RAKSHA serial gateway...")


finally:

    ser.close()

    print("Serial connection closed.")