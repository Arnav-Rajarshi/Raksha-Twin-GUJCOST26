from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from typing import List, Optional

from db.mongoDB import db
from models.MissionsModel import MissionResponse
from models.TelemetryModel import RobotStateResponse, Location, Orientation
from models.RobotPathModel import RobotPathResponse, GeoJSONLineString
from models.SensorReadingsModel import EnvironmentStateResponse
from models.DetectionModel import DetectionSummaryResponse, LatestDetection
from models.EventModel import MissionEventResponse
from models.AlertModel import AlertResponse
from models.NearbyServiceModel import NearbyServiceResponse

from routes.missions_routes import transform_mission_doc
from services.telementry_service import transform_into_robot_snapshot
from routes.sensor_routes import transform_sensor_doc
from routes.detection_routes import transform_detection_doc
from routes.event_routes import transform_event_doc
from routes.alert_routes import transform_alert_doc
from routes.nearby_services_routes import transform_nearby_service_doc

dashboard_router = APIRouter()


@dashboard_router.get("/{robot_id}/{mission_id}")
async def get_dashboard_data(robot_id: str, mission_id: str):
    try:
        now_utc = datetime.now(timezone.utc)
        now_iso = now_utc.isoformat()

        # 1. Mission
        mission_doc = await db.missions.find_one({"mission_id": mission_id})
        if mission_doc:
            mission = transform_mission_doc(mission_doc)
        else:
            mission = MissionResponse(
                mission_id=mission_id,
                name=f"Mission {mission_id}",
                status="ACTIVE",
                sector="Sector 01",
                started_at=now_iso,
                elapsed="00:00:00",
            )

        # 2. Latest Telemetry -> RobotState
        telemetry_doc = await db.telemetry.find_one(
            {
                "metadata.robot_id": robot_id,
                "metadata.mission_id": mission_id,
            },
            sort=[("timestamp", -1)],
        )
        if telemetry_doc:
            telemetry_doc.pop("_id", None)
            robot = transform_into_robot_snapshot(telemetry_doc)
        else:
            robot = RobotStateResponse(
                robot_id=robot_id,
                mission_id=mission_id,
                location=Location(latitude=21.76, longitude=72.15, altitude=0.0),
                speed=0.0,
                heading=0.0,
                orientation=Orientation(roll=0.0, pitch=0.0, yaw=0.0),
                mode="GROUND",
                battery_remaining=100.0,
                connection_status="DISCONNECTED",
                gps_satellites=0,
                last_update=now_iso,
            )

        # 3. Path from telemetry history
        cursor = db.telemetry.find(
            {
                "metadata.robot_id": robot_id,
                "metadata.mission_id": mission_id,
            }
        ).sort("timestamp", 1)

        coordinates = []
        start_time = None
        last_updated = None
        async for doc in cursor:
            ts = doc.get("timestamp")
            if ts:
                if isinstance(ts, datetime):
                    if ts.tzinfo is None:
                        ts = ts.replace(tzinfo=timezone.utc)
                    ts_iso = ts.isoformat()
                else:
                    ts_iso = str(ts)
                if start_time is None:
                    start_time = ts_iso
                last_updated = ts_iso

            lon = float(doc.get("longitude", 0.0))
            lat = float(doc.get("latitude", 0.0))
            coordinates.append((lon, lat))

        if not coordinates:
            # Fallback coordinate from robot position if available
            coordinates.append((robot.location.longitude, robot.location.latitude))

        path = RobotPathResponse(
            robot_id=robot_id,
            mission_id=mission_id,
            path=GeoJSONLineString(type="LineString", coordinates=coordinates),
            start_time=start_time or mission.started_at,
            last_updated=last_updated or robot.last_update,
        )

        # 4. Latest Environment State
        sensor_doc = await db.sensor_readings.find_one(
            {
                "metadata.robot_id": robot_id,
                "metadata.mission_id": mission_id,
            },
            sort=[("timestamp", -1)],
        )
        if sensor_doc:
            sensor_doc.pop("_id", None)
            environment = transform_sensor_doc(sensor_doc)
        else:
            environment = EnvironmentStateResponse(
                temperature=25.0,
                humidity=50.0,
                gas_value=0.0,
                range_m=0.0,
                hazard_status="NORMAL",
                last_update=now_iso,
            )

        # 5. Detection Summary
        detection_doc = await db.detection_summary.find_one({
            "robot_id": robot_id,
            "mission_id": mission_id,
        })
        if detection_doc:
            detections = transform_detection_doc(detection_doc)
        else:
            detections = DetectionSummaryResponse(
                person_count=0,
                debris_count=0,
                obstacle_count=0,
                latest_detection=LatestDetection(
                    type="NONE",
                    confidence=0.0,
                    timestamp=now_iso,
                ),
                updated_at=now_iso,
            )

        # 6. Mission Events
        event_cursor = db.mission_events.find({"mission_id": mission_id}).sort("timestamp", -1)
        events = []
        async for doc in event_cursor:
            events.append(transform_event_doc(doc))

        # 7. Alerts
        alert_cursor = db.alerts.find({"mission_id": mission_id}).sort("timestamp", -1)
        alerts = []
        async for doc in alert_cursor:
            alerts.append(transform_alert_doc(doc))

        # 8. Nearby Services
        service_cursor = db.nearby_services_cache.find({}).sort("distance_km", 1)
        nearby_services = []
        async for doc in service_cursor:
            nearby_services.append(transform_nearby_service_doc(doc))

        return {
            "mission": mission.model_dump(),
            "robot": robot.model_dump(),
            "path": path.model_dump(),
            "environment": environment.model_dump(),
            "detections": detections.model_dump(),
            "events": [e.model_dump() for e in events],
            "alerts": [a.model_dump() for a in alerts],
            "nearbyServices": [s.model_dump() for s in nearby_services],
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

