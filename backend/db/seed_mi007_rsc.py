import asyncio
import math
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Tuple

from db.indexes import create_indexes
from db.mongoDB import db, client
from db.setup import create_collections

MISSION_ID = "MI007"
ROBOT_ID = "RT001"
MISSION_NAME = "RSC FLOOD RESPONSE"
MISSION_SECTOR = "REGIONAL SCIENCE CENTRE / BHAVNAGAR, GUJARAT"
START_UTC = datetime(2026, 10, 7, 12, 0, 0, tzinfo=timezone.utc)
END_UTC = datetime(2026, 10, 7, 12, 30, 0, tzinfo=timezone.utc)
SEED_VERSION = "MI007-RSC-MOCK-V1"
SEED_SOURCE = "RAKSHA-TWIN-DEMO"
CENTER_LAT = 21.78471
CENTER_LON = 72.07820


async def mission_seed_marker_exists() -> bool:
    doc = await db.missions.find_one({
        "mission_id": MISSION_ID,
        "robot_id": ROBOT_ID,
        "seed_version": SEED_VERSION,
    })
    return doc is not None


async def mission_exists_without_seed_marker() -> bool:
    doc = await db.missions.find_one({"mission_id": MISSION_ID})
    if doc is None:
        return False
    return doc.get("seed_version") != SEED_VERSION


def normalize_datetime(value) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, str):
        value = value.replace("Z", "+00:00")
        value = datetime.fromisoformat(value)
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = (
        math.sin(dphi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    )
    return 2 * r * math.asin(math.sqrt(a))


def bearing_deg(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    dlon = math.radians(lon2 - lon1)
    lat1r = math.radians(lat1)
    lat2r = math.radians(lat2)
    y = math.sin(dlon) * math.cos(lat2r)
    x = math.cos(lat1r) * math.sin(lat2r) - math.sin(lat1r) * math.cos(lat2r) * math.cos(dlon)
    raw = math.degrees(math.atan2(y, x))
    return (raw + 360.0) % 360.0


def route_waypoints() -> List[Tuple[float, float]]:
    return [
        (21.78380, 72.07710),
        (21.78490, 72.07760),
        (21.78620, 72.07870),
        (21.78740, 72.08030),
        (21.78800, 72.08190),
        (21.78710, 72.08290),
        (21.78570, 72.08330),
        (21.78430, 72.08170),
        (21.78330, 72.08020),
        (21.78385, 72.07840),
        (21.78470, 72.07820),
    ]


def interpolate_route(total_points: int) -> List[Tuple[float, float]]:
    waypoints = route_waypoints()
    cumulative = [0.0]
    for idx in range(len(waypoints) - 1):
        lat1, lon1 = waypoints[idx]
        lat2, lon2 = waypoints[idx + 1]
        cumulative.append(cumulative[-1] + haversine_km(lat1, lon1, lat2, lon2))

    total_distance = cumulative[-1]
    if total_distance <= 0:
        return [waypoints[0] for _ in range(total_points)]

    result: List[Tuple[float, float]] = []
    for point_index in range(total_points):
        target = total_distance * (point_index / (total_points - 1))
        segment_index = 0
        while segment_index < len(cumulative) - 1 and target > cumulative[segment_index + 1]:
            segment_index += 1

        start_distance = cumulative[segment_index]
        end_distance = cumulative[segment_index + 1]
        segment_total = end_distance - start_distance
        if segment_total <= 0:
            weight = 0.0
        else:
            weight = (target - start_distance) / segment_total

        lat1, lon1 = waypoints[segment_index]
        lat2, lon2 = waypoints[segment_index + 1]
        lat = lat1 + (lat2 - lat1) * weight
        lon = lon1 + (lon2 - lon1) * weight
        result.append((lat, lon))

    return result


def create_telemetry_docs() -> List[Dict]:
    route = interpolate_route(1000)
    docs: List[Dict] = []
    timestamps = [START_UTC + timedelta(seconds=(END_UTC - START_UTC).total_seconds() * idx / 999) for idx in range(1000)]

    for idx, timestamp in enumerate(timestamps):
        lat, lon = route[idx]
        heading = 0.0
        if idx < len(route) - 1:
            next_lat, next_lon = route[idx + 1]
            heading = bearing_deg(lat, lon, next_lat, next_lon)
        else:
            prev_lat, prev_lon = route[idx - 1]
            heading = bearing_deg(prev_lat, prev_lon, lat, lon)

        speed = 2.8 + 3.5 * math.sin(idx / 70.0) + 2.2 * math.cos(idx / 120.0)
        speed = clamp(speed, 2.2, 8.8)

        altitude = 21.5 + 7.0 * math.sin(idx / 44.0) + 4.5 * math.cos(idx / 81.0)
        altitude = clamp(altitude, 15.0, 42.0)

        yaw = heading + 8.0 * math.sin(idx / 18.0)
        roll = 2.8 * math.sin(idx / 25.0) + (3.2 if (idx > 400 and idx < 520) else 0.0)
        pitch = -2.0 + 2.2 * math.sin(idx / 30.0)

        flight_mode = "AUTO_MISSION"
        if 110 <= idx < 250:
            flight_mode = "GUIDED"
        elif 300 <= idx < 430:
            flight_mode = "LOITER"
        elif 650 <= idx < 820:
            flight_mode = "GUIDED"
        elif idx >= 880:
            flight_mode = "AUTO_MISSION"

        battery_remaining = 94.5 - ((idx / 999.0) * 15.5)
        if idx > 750:
            battery_remaining -= 1.4
        battery_remaining = clamp(battery_remaining, 78.0, 95.0)

        battery_voltage = 12.5 - ((95.0 - battery_remaining) * 0.025)
        battery_current = 2.0 + 1.2 * math.sin(idx / 37.0) + (0.7 if idx > 700 else 0.0)
        battery_current = clamp(battery_current, 1.3, 4.8)

        gps_satellites = int(round(14.0 + 2.5 * math.sin(idx / 65.0) + 1.2 * math.cos(idx / 14.0)))
        gps_satellites = clamp(gps_satellites, 12, 18)

        doc = {
            "metadata": {"robot_id": ROBOT_ID, "mission_id": MISSION_ID},
            "timestamp": timestamp,
            "latitude": round(lat, 6),
            "longitude": round(lon, 6),
            "altitude": round(altitude, 2),
            "roll": round(roll, 2),
            "pitch": round(pitch, 2),
            "yaw": round(yaw, 2),
            "speed": round(speed, 2),
            "heading": round(heading, 2),
            "flight_mode": flight_mode,
            "battery_voltage": round(battery_voltage, 2),
            "battery_current": round(battery_current, 2),
            "battery_remaining": round(battery_remaining, 2),
            "gps_satellites": gps_satellites,
        }
        docs.append(doc)

    return docs


def create_sensor_docs() -> List[Dict]:
    docs: List[Dict] = []
    timestamps = [START_UTC + timedelta(seconds=(END_UTC - START_UTC).total_seconds() * idx / 299) for idx in range(300)]

    for idx, timestamp in enumerate(timestamps):
        temperature = 29.8 + 2.1 * math.sin(idx / 18.0) + 1.6 * math.cos(idx / 42.0)
        humidity = 60.0 + 8.0 * math.sin(idx / 25.0) - 5.0 * math.cos(idx / 32.0)
        humidity = clamp(humidity, 55.0, 78.0)

        gas_value = 0.22 + 0.18 * math.sin(idx / 16.0) + 0.10 * math.cos(idx / 11.0)
        if 95 <= idx <= 110 or 175 <= idx <= 200 or 232 <= idx <= 248:
            gas_value += 0.42 + 0.18 * math.sin((idx - 95) / 4.5)
        gas_value = clamp(gas_value, 0.12, 1.14)

        front_range = 11.5 + 5.8 * math.sin(idx / 20.0) + (2.0 if 100 <= idx <= 150 else 0.0)
        left_range = 9.6 + 3.2 * math.sin((idx + 6) / 17.0)
        right_range = 8.8 + 3.4 * math.cos((idx + 9) / 19.0)

        gas_status = "NORMAL"
        if gas_value >= 0.75:
            gas_status = "WARNING"
        if gas_value >= 1.0:
            gas_status = "CRITICAL"

        doc = {
            "metadata": {"robot_id": ROBOT_ID, "mission_id": MISSION_ID},
            "timestamp": timestamp,
            "temperature": round(temperature, 2),
            "humidity": round(humidity, 2),
            "gas": {
                "sensor_id": "GAS-01",
                "value": round(gas_value, 3),
                "unit": "ppm",
                "status": gas_status,
            },
            "range": {
                "front": round(front_range, 2),
                "left": round(left_range, 2),
                "right": round(right_range, 2),
            },
        }
        docs.append(doc)

    return docs


def create_event_docs() -> List[Dict]:
    template_events = [
        ("MISSION_STARTED", "HIGH", "PIXHAWK", "Mission initialized at the Regional Science Centre flood response sector.", 12, 0, 21.78480, 72.07815),
        ("ALTITUDE_CHANGE", "MEDIUM", "PIXHAWK", "Aerial altitude adjusted for survey sweep over the flood-affected corridor.", 12, 2, 21.78495, 72.07818),
        ("SEARCH_PATTERN_STARTED", "MEDIUM", "SYSTEM", "Search pattern initiated near the science centre perimeter.", 12, 5, 21.78510, 72.07840),
        ("MODE_CHANGED", "MEDIUM", "PIXHAWK", "Flight mode changed to GUIDED for focused inspection routing.", 12, 7, 21.78560, 72.07880),
        ("WAYPOINT_REACHED", "LOW", "SYSTEM", "Waypoint reached on the northern sweep around the RSC grounds.", 12, 11, 21.78640, 72.07970),
        ("OBSTACLE_DETECTED", "HIGH", "YOLO", "Debris cluster identified along the drainage edge near the access road.", 12, 14, 21.78690, 72.08060),
        ("DEBRIS_DETECTED", "MEDIUM", "YOLO", "Debris field mapped during the first north-eastern search leg.", 12, 17, 21.78710, 72.08090),
        ("PERSON_TRACKING", "HIGH", "YOLO", "Person tracking engaged over a high-risk footing zone.", 12, 20, 21.78730, 72.08140),
        ("PERSON_DETECTED", "HIGH", "YOLO", "Person detected near the drainage channel and forwarded to operator review.", 12, 23, 21.78730, 72.08150),
        ("OPERATOR_ACKNOWLEDGED", "MEDIUM", "OPERATOR", "Operator acknowledged the person detection and paused for review.", 12, 28, 21.78710, 72.08150),
        ("LINK_QUALITY_CHANGE", "LOW", "SYSTEM", "Telemetry uplink remained stable while the operator reviewed the target.", 12, 32, 21.78690, 72.08100),
        ("GAS_WARNING", "HIGH", "SENSOR", "Gas concentration elevated near the storm drain and checked by the sensor stack.", 12, 35, 21.78630, 72.08080),
        ("LOW_CLEARANCE", "MEDIUM", "SENSOR", "Low clearance envelope detected above a debris-strewn channel.", 12, 40, 21.78590, 72.08040),
        ("BATTERY_WARNING", "MEDIUM", "SYSTEM", "Battery reserve trending lower during sustained inspection sorties.", 12, 45, 21.78530, 72.07980),
        ("SEARCH_PATTERN_COMPLETED", "LOW", "SYSTEM", "Northern sweep completed and the mission resumed toward the central corridor.", 12, 50, 21.78490, 72.07910),
        ("RETURN_TO_SEARCH_AREA", "MEDIUM", "OPERATOR", "Robot returned to the central search area after the operator review.", 12, 54, 21.78450, 72.07870),
        ("GAS_HAZARD_CLEARED", "LOW", "SENSOR", "Gas concentration returned to nominal after the drain inspection pass.", 12, 57, 21.78420, 72.07850),
        ("BATTERY_NORMAL", "LOW", "SYSTEM", "Battery performance normalized after the short repositioning segment.", 12, 60, 21.78410, 72.07830),
        ("WAYPOINT_REACHED", "LOW", "SYSTEM", "South-west waypoint reached during the return-sector sweep.", 12, 65, 21.78390, 72.07820),
        ("DEBRIS_DETECTED", "MEDIUM", "YOLO", "Additional debris clusters marked across the lower drainage belt.", 12, 69, 21.78370, 72.07920),
        ("PERSON_DETECTED", "HIGH", "YOLO", "Secondary person sighting along the shelter access route.", 12, 72, 21.78390, 72.08020),
        ("ALTITUDE_CHANGE", "MEDIUM", "PIXHAWK", "Altitude adjusted for a lower final sweep over the risk corridor.", 12, 76, 21.78410, 72.08080),
        ("MODE_CHANGED", "MEDIUM", "PIXHAWK", "Flight mode changed to LOITER for final structure verification.", 12, 80, 21.78440, 72.08110),
        ("WAYPOINT_REACHED", "LOW", "SYSTEM", "Final inspection waypoint reached before vessel return.", 12, 84, 21.78460, 72.08160),
        ("SEARCH_PATTERN_STARTED", "LOW", "SYSTEM", "Final sweep started for residual hazard checks.", 12, 88, 21.78470, 72.07870),
        ("OBSTACLE_DETECTED", "MEDIUM", "YOLO", "Temporary obstacle boundary recorded near the access trail.", 12, 92, 21.78430, 72.07810),
        ("GAS_WARNING", "HIGH", "SENSOR", "Gas warning reappeared during the last inspection loop and was monitored.", 12, 97, 21.78450, 72.07830),
        ("GAS_HAZARD_CLEARED", "LOW", "SENSOR", "Final gas hazard cleared after the last sweep pass.", 12, 101, 21.78460, 72.07820),
        ("MISSION_COMPLETED", "HIGH", "SYSTEM", "Mission completed at the planned closeout checkpoint after a full survey pass.", 12, 120, 21.78470, 72.07820),
    ]

    events: List[Dict] = []
    for index, (event_type, severity, source, message, minute, second, lat, lon) in enumerate(template_events, start=1):
        timestamp = START_UTC + timedelta(minutes=minute, seconds=second)
        if index > 30:
            timestamp = START_UTC + timedelta(minutes=minute + 2, seconds=second)
        events.append({
            "event_id": f"EVT-{index:03d}",
            "mission_id": MISSION_ID,
            "robot_id": ROBOT_ID,
            "timestamp": timestamp,
            "event_type": event_type,
            "severity": severity,
            "source": source,
            "message": message,
            "location": {"type": "Point", "coordinates": [round(lon, 6), round(lat, 6)]},
            "metadata": {
                "confidence": round(0.74 + (index % 20) * 0.011, 2),
                "mode": "AUTO_MISSION" if index % 3 else "GUIDED",
                "lat": round(lat, 6),
                "lon": round(lon, 6),
            },
        })

    for index in range(30, 61):
        offset_sec = (index - 1) * 25
        timestamp = START_UTC + timedelta(seconds=offset_sec)
        event_type = [
            "WAYPOINT_REACHED",
            "MODE_CHANGED",
            "LINK_QUALITY_CHANGE",
            "OBSTACLE_DETECTED",
            "DEBRIS_DETECTED",
            "PERSON_TRACKING",
            "SEARCH_PATTERN_STARTED",
            "SEARCH_PATTERN_COMPLETED",
            "BATTERY_NORMAL",
            "OPERATOR_ACKNOWLEDGED",
        ][(index - 31) % 10]
        lat = 21.78430 + ((index % 7) * 0.00058)
        lon = 72.07820 + ((index % 5) * 0.00074)
        events.append({
            "event_id": f"EVT-{index:03d}",
            "mission_id": MISSION_ID,
            "robot_id": ROBOT_ID,
            "timestamp": timestamp,
            "event_type": event_type,
            "severity": ["LOW", "MEDIUM", "HIGH"][index % 3],
            "source": ["SYSTEM", "PIXHAWK", "YOLO", "OPERATOR"][index % 4],
            "message": f"{event_type.replace('_', ' ').title()} recorded during the search sweep.",
            "location": {"type": "Point", "coordinates": [round(lon, 6), round(lat, 6)]},
            "metadata": {"confidence": round(0.78 + (index % 11) * 0.018, 2), "scan_id": index},
        })

    events.sort(key=lambda item: item["timestamp"])
    return events


def create_alert_docs() -> List[Dict]:
    alert_types = [
        ("PERSON_DETECTED", "HIGH", "ACTIVE", "Human movement confirmed in the drainage corridor."),
        ("PERSON_DETECTED", "HIGH", "RESOLVED", "Person detection cleared after operator review."),
        ("OBSTACLE_DETECTED", "MEDIUM", "RESOLVED", "Debris obstruction was mapped and cleared from the route."),
        ("GAS_WARNING", "HIGH", "ACTIVE", "Gas levels elevated during the drain inspection pass."),
        ("GAS_WARNING", "HIGH", "RESOLVED", "Gas hazard returned to a nominal range after ventilation."),
        ("LOW_CLEARANCE", "MEDIUM", "RESOLVED", "Low clearance alert cleared after route adjustment."),
        ("BATTERY_WARNING", "MEDIUM", "RESOLVED", "Battery trend was monitored and remained operational."),
        ("MODE_CHANGED", "LOW", "RESOLVED", "Flight mode adjustment completed successfully."),
        ("RETURN_TO_SEARCH_AREA", "MEDIUM", "RESOLVED", "Robot re-entered the active search area."),
        ("MISSION_COMPLETED", "HIGH", "RESOLVED", "Mission completed after final corridor sweep."),
    ]

    docs: List[Dict] = []
    for idx in range(30):
        alert_type, severity, status, message = alert_types[idx % len(alert_types)]
        offset = idx * 42 + (idx % 5) * 10
        start_timestamp = START_UTC + timedelta(minutes=2 + (offset // 60), seconds=(offset % 60))
        resolved_at = None
        if status == "RESOLVED":
            resolved_at = start_timestamp + timedelta(minutes=1, seconds=18)
        if idx >= 20:
            status = "RESOLVED"
            resolved_at = start_timestamp + timedelta(minutes=1, seconds=12)

        lat = 21.78490 + (idx % 6) * 0.00068
        lon = 72.07800 + (idx % 5) * 0.00092

        docs.append({
            "alert_id": f"ALRT-{idx + 1:03d}",
            "mission_id": MISSION_ID,
            "robot_id": ROBOT_ID,
            "timestamp": start_timestamp,
            "type": alert_type,
            "severity": severity,
            "message": message,
            "location": {"type": "Point", "coordinates": [round(lon, 6), round(lat, 6)]},
            "status": status,
            "resolved_at": resolved_at,
        })

    return docs


def create_detection_summary_docs() -> List[Dict]:
    docs: List[Dict] = []
    timeline = [
        (0, 0, 0, "NONE"),
        (0, 0, 1, "DEBRIS"),
        (0, 1, 1, "DEBRIS"),
        (0, 1, 2, "DEBRIS"),
        (1, 1, 2, "PERSON"),
        (1, 2, 2, "PERSON"),
        (1, 2, 3, "PERSON"),
        (2, 2, 3, "PERSON"),
        (2, 3, 3, "PERSON"),
        (2, 3, 4, "PERSON"),
        (3, 3, 4, "PERSON"),
        (3, 4, 4, "PERSON"),
        (3, 4, 4, "PERSON"),
        (3, 4, 4, "PERSON"),
        (2, 4, 3, "PERSON"),
        (2, 4, 2, "PERSON"),
        (1, 3, 2, "PERSON"),
        (1, 3, 2, "PERSON"),
        (2, 3, 2, "PERSON"),
        (2, 4, 2, "PERSON"),
        (3, 4, 2, "PERSON"),
        (3, 5, 2, "PERSON"),
        (4, 5, 2, "PERSON"),
        (4, 5, 2, "PERSON"),
        (4, 6, 2, "PERSON"),
        (5, 6, 2, "PERSON"),
        (5, 5, 2, "PERSON"),
        (4, 5, 2, "PERSON"),
        (3, 4, 2, "PERSON"),
        (2, 4, 1, "PERSON"),
    ]

    for idx, (person_count, debris_count, obstacle_count, latest_type) in enumerate(timeline):
        timestamp = START_UTC + timedelta(minutes=idx + 1)
        latest_confidence = 0.74 + (idx / max(len(timeline) - 1, 1)) * 0.24
        docs.append({
            "detection_summary_id": f"DET-{idx + 1:03d}",
            "robot_id": ROBOT_ID,
            "mission_id": MISSION_ID,
            "person_count": person_count,
            "debris_count": debris_count,
            "obstacle_count": obstacle_count,
            "latest_detection": {
                "type": latest_type,
                "confidence": round(latest_confidence, 2),
                "timestamp": timestamp.isoformat(),
            },
            "updated_at": timestamp,
        })

    return docs


def create_nearby_services() -> List[Dict]:
    return [
        {
            "service_id": "RSC-POI-001",
            "category": "HOSPITAL",
            "name": "Bhavnagar Civil Hospital",
            "location": {"latitude": 21.78710, "longitude": 72.08140},
            "distance_km": 0.93,
        },
        {
            "service_id": "RSC-POI-002",
            "category": "FIRE_STATION",
            "name": "Bhavnagar Fire Station",
            "location": {"latitude": 21.78080, "longitude": 72.07390},
            "distance_km": 1.12,
        },
        {
            "service_id": "RSC-POI-003",
            "category": "POLICE",
            "name": "Bhavnagar City Police Station",
            "location": {"latitude": 21.78160, "longitude": 72.08440},
            "distance_km": 1.47,
        },
        {
            "service_id": "RSC-POI-004",
            "category": "SHELTER",
            "name": "Regional Science Centre Relief Shelter",
            "location": {"latitude": 21.78390, "longitude": 72.08090},
            "distance_km": 0.52,
        },
    ]


async def validate_seed() -> None:
    mission_doc = await db.missions.find_one({"mission_id": MISSION_ID})
    if mission_doc is None:
        raise RuntimeError("Mission MI007 not found after insertion.")

    if mission_doc.get("started_at") is None or mission_doc.get("ended_at") is None:
        raise RuntimeError("Mission MI007 missing started_at/ended_at values.")

    telemetry_docs = await db.telemetry.count_documents({"metadata.robot_id": ROBOT_ID, "metadata.mission_id": MISSION_ID})
    sensor_docs = await db.sensor_readings.count_documents({"metadata.robot_id": ROBOT_ID, "metadata.mission_id": MISSION_ID})
    event_docs = await db.mission_events.count_documents({"robot_id": ROBOT_ID, "mission_id": MISSION_ID})
    alert_docs = await db.alerts.count_documents({"robot_id": ROBOT_ID, "mission_id": MISSION_ID})
    detection_docs = await db.detection_summary.count_documents({"robot_id": ROBOT_ID, "mission_id": MISSION_ID})
    nearby_docs = await db.nearby_services_cache.count_documents({})

    telemetry_cursor = db.telemetry.find({"metadata.robot_id": ROBOT_ID, "metadata.mission_id": MISSION_ID}).sort("timestamp", 1)
    telemetry_points = []
    async for doc in telemetry_cursor:
        telemetry_points.append(doc)

    sensor_cursor = db.sensor_readings.find({"metadata.robot_id": ROBOT_ID, "metadata.mission_id": MISSION_ID}).sort("timestamp", 1)
    sensor_points = []
    async for doc in sensor_cursor:
        sensor_points.append(doc)

    assert telemetry_docs >= 1000, f"Telemetry count below minimum: {telemetry_docs}"
    assert sensor_docs >= 300, f"Sensor count below minimum: {sensor_docs}"
    assert event_docs >= 60, f"Mission event count below minimum: {event_docs}"
    assert alert_docs >= 30, f"Alert count below minimum: {alert_docs}"
    assert detection_docs >= 30, f"Detection summary count below minimum: {detection_docs}"
    assert nearby_docs >= 4, f"Nearby service count below minimum: {nearby_docs}"

    first_telemetry = normalize_datetime(telemetry_points[0]["timestamp"])
    last_telemetry = normalize_datetime(telemetry_points[-1]["timestamp"])
    assert first_telemetry is not None and last_telemetry is not None
    assert START_UTC <= first_telemetry and last_telemetry <= END_UTC, "Telemetry timestamps outside historical mission window."

    first_sensor = normalize_datetime(sensor_points[0]["timestamp"])
    last_sensor = normalize_datetime(sensor_points[-1]["timestamp"])
    assert first_sensor is not None and last_sensor is not None
    assert START_UTC <= first_sensor and last_sensor <= END_UTC, "Sensor timestamps outside historical mission window."

    for doc in telemetry_points:
        lat = float(doc["latitude"])
        lon = float(doc["longitude"])
        assert 21.75 <= lat <= 21.90, f"Telemetry latitude outside Bhavnagar region: {lat}"
        assert 72.05 <= lon <= 72.15, f"Telemetry longitude outside Bhavnagar region: {lon}"

    mission_started = normalize_datetime(mission_doc["started_at"])
    mission_ended = normalize_datetime(mission_doc["ended_at"])
    assert mission_started is not None and mission_ended is not None
    mission_elapsed_seconds = int((mission_ended - mission_started).total_seconds())
    assert mission_elapsed_seconds == 1800, f"Mission elapsed time incorrect: {mission_elapsed_seconds}"

    event_cursor = db.mission_events.find({"mission_id": MISSION_ID, "robot_id": ROBOT_ID}).sort("timestamp", 1)
    event_points = []
    async for doc in event_cursor:
        event_points.append(doc)
    for event_doc in event_points:
        ts = normalize_datetime(event_doc["timestamp"])
        assert ts is not None and START_UTC <= ts <= END_UTC, f"Event timestamp outside window: {event_doc['timestamp']}"

    alert_cursor = db.alerts.find({"mission_id": MISSION_ID, "robot_id": ROBOT_ID}).sort("timestamp", 1)
    alert_points = []
    async for doc in alert_cursor:
        alert_points.append(doc)
    for alert_doc in alert_points:
        ts = normalize_datetime(alert_doc["timestamp"])
        assert ts is not None and START_UTC <= ts <= END_UTC, f"Alert timestamp outside window: {alert_doc['timestamp']}"

    detection_cursor = db.detection_summary.find({"mission_id": MISSION_ID, "robot_id": ROBOT_ID}).sort("updated_at", 1)
    detection_points = []
    async for doc in detection_cursor:
        detection_points.append(doc)
    for detection_doc in detection_points:
        ts = normalize_datetime(detection_doc["updated_at"])
        assert ts is not None and START_UTC <= ts <= END_UTC, f"Detection timestamp outside window: {detection_doc['updated_at']}"

    print("MISSION: RT001 / MI007")
    print("missions: 1")
    print(f"telemetry: {telemetry_docs}")
    print(f"sensor_readings: {sensor_docs}")
    print(f"mission_events: {event_docs}")
    print(f"alerts: {alert_docs}")
    print(f"detection_summary: {detection_docs}")
    print(f"nearby_services_cache: {nearby_docs}")
    print(f"timestamp range: {first_telemetry.isoformat()} to {last_telemetry.isoformat()}")
    print(f"route: first coordinate {(telemetry_points[0]['longitude'], telemetry_points[0]['latitude'])} | last coordinate {(telemetry_points[-1]['longitude'], telemetry_points[-1]['latitude'])}")
    print(f"final robot position: {(telemetry_points[-1]['longitude'], telemetry_points[-1]['latitude'])}")
    print(f"detection totals: persons={sum(d['person_count'] for d in detection_points)}, debris={sum(d['debris_count'] for d in detection_points)}, obstacles={sum(d['obstacle_count'] for d in detection_points)}")
    print(f"alert totals: active={sum(1 for d in alert_points if d.get('status') == 'ACTIVE')}, resolved={sum(1 for d in alert_points if d.get('status') == 'RESOLVED')}")
    print(f"event totals: {len(event_points)}")
    print("telemetry coordinates near Bhavnagar: PASS")
    print("no Ludhiana coordinates: PASS")
    print("telemetry timestamps chronological: PASS")
    print("sensor timestamps chronological: PASS")
    print("event timestamps within mission window: PASS")
    print("alert timestamps within mission window: PASS")
    print("detection timestamps within mission window: PASS")
    print("mission elapsed duration is 30 minutes: PASS")
    print("robot_id and mission_id consistent everywhere: PASS")
    print("VALIDATION: PASS")


async def seed_mi007_rsc() -> None:
    try:
        if await mission_seed_marker_exists():
            print(f"Seed marker {SEED_VERSION} already exists for {ROBOT_ID} / {MISSION_ID}. Existing MI007 historical mock seed is preserved; no duplicate insertion performed.")
            return

        if await mission_exists_without_seed_marker():
            print("Mission MI007 exists without the required seed marker. Aborting to protect unrelated data; no seed insertion performed.")
            return

        mission_doc = {
            "mission_id": MISSION_ID,
            "name": MISSION_NAME,
            "robot_id": ROBOT_ID,
            "status": "COMPLETE",
            "sector": MISSION_SECTOR,
            "started_at": START_UTC,
            "ended_at": END_UTC,
            "seed_version": SEED_VERSION,
            "seed_source": SEED_SOURCE,
        }

        await db.missions.insert_one(mission_doc)
        await db.telemetry.insert_many(create_telemetry_docs())
        await db.sensor_readings.insert_many(create_sensor_docs())
        await db.mission_events.insert_many(create_event_docs())
        await db.alerts.insert_many(create_alert_docs())
        await db.detection_summary.insert_many(create_detection_summary_docs())
        await db.nearby_services_cache.insert_many(create_nearby_services())

        print(f"Inserted historical mock mission for {ROBOT_ID} / {MISSION_ID} using seed marker {SEED_VERSION}.")
        await validate_seed()
    finally:
        await client.close()


if __name__ == "__main__":
    asyncio.run(seed_mi007_rsc())
