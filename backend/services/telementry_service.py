from datetime import datetime, timezone
from db.settings import settings
from models.TelemetryModel import Location, Orientation, RobotStateResponse


def transform_into_robot_snapshot(telemetry_doc: dict) -> RobotStateResponse:
    raw_timestamp = telemetry_doc.get("timestamp")
    
    if isinstance(raw_timestamp, str):
        try:
            last_update = datetime.fromisoformat(raw_timestamp)
        except Exception:
            last_update = datetime.now(timezone.utc)
    elif isinstance(raw_timestamp, datetime):
        last_update = raw_timestamp
    else:
        last_update = datetime.now(timezone.utc)

    # Ensure timezone aware UTC
    if last_update.tzinfo is None:
        last_update = last_update.replace(tzinfo=timezone.utc)

    # Determine whether Telemetry is fresh
    now = datetime.now(timezone.utc)
    age = (now - last_update).total_seconds()

    connection_status = (
        "CONNECTED"
        if age <= settings.TELEMETRY_CONNECTION_TIMEOUT_SECONDS
        else "DISCONNECTED"
    )

    altitude = float(telemetry_doc.get("altitude", 0.0))
    mode = (
        "AERIAL"
        if altitude >= settings.AERIAL_ALTITUDE_THRESHOLD_M
        else "GROUND"
    )

    # Extract robot_id and mission_id from metadata or root
    metadata = telemetry_doc.get("metadata", {})
    robot_id = metadata.get("robot_id") or telemetry_doc.get("robot_id", "UNKNOWN")
    mission_id = metadata.get("mission_id") or telemetry_doc.get("mission_id", "UNKNOWN")

    gps_satellites = int(telemetry_doc.get("gps_satellites", 16))

    return RobotStateResponse(
        robot_id=robot_id,
        mission_id=mission_id,
        location=Location(
            latitude=float(telemetry_doc.get("latitude", 0.0)),
            longitude=float(telemetry_doc.get("longitude", 0.0)),
            altitude=altitude,
        ),
        speed=round(float(telemetry_doc.get("speed", 0.0)), 1),
        heading=round(float(telemetry_doc.get("heading", 0.0))),
        orientation=Orientation(
            roll=round(float(telemetry_doc.get("roll", 0.0)), 1),
            pitch=round(float(telemetry_doc.get("pitch", 0.0)), 1),
            yaw=round(float(telemetry_doc.get("yaw", 0.0)), 1),
        ),
        mode=mode,
        battery_remaining=round(float(telemetry_doc.get("battery_remaining", 100.0))),
        connection_status=connection_status,
        gps_satellites=gps_satellites,
        last_update=last_update.isoformat(),
    )
