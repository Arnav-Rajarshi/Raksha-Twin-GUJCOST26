import asyncio
from datetime import datetime, timezone, timedelta
from db.mongoDB import db
from db.setup import create_collections
from db.indexes import create_indexes


async def seed_database():
    print("Ensuring collections & indexes exist...")
    await create_collections()
    await create_indexes()

    robot_id = "RAKSHA-01"
    mission_id = "MISSION-001"
    base_time = datetime.now(timezone.utc) - timedelta(minutes=72)

    # 1. Mission
    print("Seeding mission...")
    await db.missions.update_one(
        {"mission_id": mission_id},
        {
            "$set": {
                "mission_id": mission_id,
                "name": "Flood Rescue A",
                "robot_id": robot_id,
                "status": "ACTIVE",
                "sector": "Sector 07 / Ludhiana",
                "started_at": base_time,
                "ended_at": None,
            }
        },
        upsert=True
    )

    # 2. Telemetry path & history
    print("Seeding telemetry points...")
    coords = [
        (75.8460, 30.8940, 25.0, 1.1, -0.4, 170.0, 6.2, 170),
        (75.8490, 30.8960, 32.0, 1.2, -0.6, 175.0, 7.5, 175),
        (75.8510, 30.8990, 38.5, 1.0, -0.7, 180.0, 8.0, 180),
        (75.8540, 30.8980, 40.0, 1.3, -0.8, 182.0, 8.2, 182),
        (75.8555, 30.9005, 41.5, 1.1, -0.5, 183.5, 8.3, 183),
        (75.8573, 30.9010, 42.5, 1.2, -0.8, 185.4, 8.4, 184),
    ]

    for i, (lon, lat, alt, roll, pitch, yaw, spd, hdg) in enumerate(coords):
        t = base_time + timedelta(minutes=i * 12)
        # If last point, set timestamp to now so it is fresh and CONNECTED
        if i == len(coords) - 1:
            t = datetime.now(timezone.utc)

        telemetry_doc = {
            "metadata": {
                "robot_id": robot_id,
                "mission_id": mission_id,
            },
            "timestamp": t,
            "latitude": lat,
            "longitude": lon,
            "altitude": alt,
            "roll": roll,
            "pitch": pitch,
            "yaw": yaw,
            "speed": spd,
            "heading": hdg,
            "flight_mode": "AUTO_MISSION",
            "battery_voltage": 12.4,
            "battery_current": 2.1,
            "battery_remaining": 76.0,
            "gps_satellites": 16,
        }
        await db.telemetry.insert_one(telemetry_doc)

    # 3. Sensor Readings
    print("Seeding sensor readings...")
    sensor_readings = [
        {
            "metadata": {"robot_id": robot_id, "mission_id": mission_id},
            "timestamp": datetime.now(timezone.utc),
            "temperature": 31.4,
            "humidity": 67.0,
            "gas": {
                "sensor_id": "GAS-01",
                "value": 0.42,
                "unit": "ppm",
            },
            "range": {
                "front": 18.6,
                "left": 4.5,
                "right": 5.2,
            },
        }
    ]
    for sr in sensor_readings:
        await db.sensor_readings.insert_one(sr)

    # 4. Detection Summary
    print("Seeding detection summary...")
    await db.detection_summary.update_one(
        {"robot_id": robot_id, "mission_id": mission_id},
        {
            "$set": {
                "robot_id": robot_id,
                "mission_id": mission_id,
                "person_count": 3,
                "debris_count": 2,
                "obstacle_count": 1,
                "latest_detection": {
                    "type": "PERSON",
                    "confidence": 0.94,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                },
                "updated_at": datetime.now(timezone.utc),
            }
        },
        upsert=True
    )

    # 5. Mission Events
    print("Seeding mission events...")
    events = [
        {
            "event_id": "EVENT-006",
            "mission_id": mission_id,
            "robot_id": robot_id,
            "timestamp": datetime.now(timezone.utc) - timedelta(minutes=2),
            "event_type": "PERSON_DETECTED",
            "severity": "HIGH",
            "source": "YOLO",
            "message": "Person located near collapsed structure",
            "location": {"type": "Point", "coordinates": [75.8573, 30.9010]},
            "metadata": {"confidence": 0.94},
        },
        {
            "event_id": "EVENT-005",
            "mission_id": mission_id,
            "robot_id": robot_id,
            "timestamp": datetime.now(timezone.utc) - timedelta(minutes=5),
            "event_type": "GAS_HAZARD_CLEARED",
            "severity": "LOW",
            "source": "SENSOR",
            "message": "Gas reading returned to nominal range",
            "location": {"type": "Point", "coordinates": [75.8555, 30.9005]},
            "metadata": {"gas_value": 0.42},
        },
        {
            "event_id": "EVENT-004",
            "mission_id": mission_id,
            "robot_id": robot_id,
            "timestamp": datetime.now(timezone.utc) - timedelta(minutes=10),
            "event_type": "MODE_CHANGED",
            "severity": "MEDIUM",
            "source": "PIXHAWK",
            "message": "Aerial mode engaged",
            "location": {"type": "Point", "coordinates": [75.8540, 30.8980]},
            "metadata": {"mode": "AERIAL"},
        },
        {
            "event_id": "EVENT-003",
            "mission_id": mission_id,
            "robot_id": robot_id,
            "timestamp": datetime.now(timezone.utc) - timedelta(minutes=15),
            "event_type": "OBSTACLE_DETECTED",
            "severity": "MEDIUM",
            "source": "YOLO",
            "message": "Road obstruction classified as debris",
            "location": {"type": "Point", "coordinates": [75.8510, 30.8990]},
            "metadata": {"confidence": 0.88},
        },
    ]

    for ev in events:
        await db.mission_events.update_one(
            {"event_id": ev["event_id"]},
            {"$set": ev},
            upsert=True
        )

    # 6. Alerts
    print("Seeding alerts...")
    alerts = [
        {
            "alert_id": "ALERT-001",
            "mission_id": mission_id,
            "robot_id": robot_id,
            "timestamp": datetime.now(timezone.utc) - timedelta(minutes=2),
            "type": "PERSON_DETECTED",
            "severity": "HIGH",
            "message": "Human detected — operator review required",
            "location": {"type": "Point", "coordinates": [75.8573, 30.9010]},
            "status": "ACTIVE",
            "resolved_at": None,
        }
    ]

    for al in alerts:
        await db.alerts.update_one(
            {"alert_id": al["alert_id"]},
            {"$set": al},
            upsert=True
        )

    # 7. Nearby Services
    print("Seeding nearby services...")
    services = [
        {
            "service_id": "POI-01",
            "category": "HOSPITAL",
            "name": "Civil Hospital",
            "location": {"latitude": 30.9070, "longitude": 75.8620},
            "distance_km": 1.2,
        },
        {
            "service_id": "POI-02",
            "category": "FIRE_STATION",
            "name": "Central Fire Station",
            "location": {"latitude": 30.8950, "longitude": 75.8490},
            "distance_km": 1.7,
        },
        {
            "service_id": "POI-03",
            "category": "POLICE",
            "name": "Division 4 Police",
            "location": {"latitude": 30.9040, "longitude": 75.8450},
            "distance_km": 2.1,
        },
        {
            "service_id": "POI-04",
            "category": "SHELTER",
            "name": "Relief Camp Alpha",
            "location": {"latitude": 30.8930, "longitude": 75.8600},
            "distance_km": 2.4,
        },
    ]

    for srv in services:
        await db.nearby_services_cache.update_one(
            {"service_id": srv["service_id"]},
            {"$set": srv},
            upsert=True
        )

    print("Database seeding completed successfully!")


if __name__ == "__main__":
    asyncio.run(seed_database())

