from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from typing import List

from services.telementry_service import transform_into_robot_snapshot
from models.TelemetryModel import Telemetry, RobotStateResponse
from models.RobotPathModel import RobotPathResponse, GeoJSONLineString
from db.mongoDB import db

telemetry_router = APIRouter()


@telemetry_router.post("")
async def save_latest_telemetry_data(data: Telemetry):
    try:
        document = data.model_dump()

        document["metadata"] = {
            "robot_id": data.robot_id,
            "mission_id": data.mission_id,
        }

        # Keep metadata and remove redundant top-level IDs for MongoDB time-series
        document.pop("robot_id", None)
        document.pop("mission_id", None)

        if document.get("timestamp") and document["timestamp"].tzinfo is None:
            document["timestamp"] = document["timestamp"].replace(tzinfo=timezone.utc)

        await db.telemetry.insert_one(document)

        document.pop("_id", None)
        return {
            "robot_id": data.robot_id,
            "mission_id": data.mission_id,
            "timestamp": document["timestamp"].isoformat() if isinstance(document["timestamp"], datetime) else str(document["timestamp"]),
            "message": "Telemetry data saved successfully.",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@telemetry_router.get("/latest/{robot_id}/{mission_id}", response_model=RobotStateResponse)
async def get_telemetry_data(robot_id: str, mission_id: str):
    try:
        document = await db.telemetry.find_one(
            {
                "metadata.robot_id": robot_id,
                "metadata.mission_id": mission_id,
            },
            sort=[("timestamp", -1)],
        )

        if document is None:
            raise HTTPException(
                status_code=404,
                detail="No telemetry found for this robot and mission",
            )

        document.pop("_id", None)
        return transform_into_robot_snapshot(document)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@telemetry_router.get("/path/{robot_id}/{mission_id}", response_model=RobotPathResponse)
async def get_robot_path(robot_id: str, mission_id: str):
    try:
        cursor = db.telemetry.find(
            {
                "metadata.robot_id": robot_id,
                "metadata.mission_id": mission_id,
            }
        ).sort("timestamp", 1)  # Chronological order for path

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
            # GeoJSON requires [longitude, latitude]
            coordinates.append((lon, lat))

        if not coordinates:
            # Check if mission exists to provide default or return 404
            now_iso = datetime.now(timezone.utc).isoformat()
            return RobotPathResponse(
                robot_id=robot_id,
                mission_id=mission_id,
                path=GeoJSONLineString(type="LineString", coordinates=[]),
                start_time=now_iso,
                last_updated=now_iso,
            )

        return RobotPathResponse(
            robot_id=robot_id,
            mission_id=mission_id,
            path=GeoJSONLineString(type="LineString", coordinates=coordinates),
            start_time=start_time or datetime.now(timezone.utc).isoformat(),
            last_updated=last_updated or datetime.now(timezone.utc).isoformat(),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@telemetry_router.get("/records/{robot_id}/{mission_id}")
async def get_telemetry_records(robot_id: str, mission_id: str):
    try:
        cursor = db.telemetry.find(
            {
                "metadata.robot_id": robot_id,
                "metadata.mission_id": mission_id,
            }
        ).sort("timestamp", -1)

        documents = []
        async for doc in cursor:
            doc.pop("_id", None)
            if isinstance(doc.get("timestamp"), datetime):
                if doc["timestamp"].tzinfo is None:
                    doc["timestamp"] = doc["timestamp"].replace(tzinfo=timezone.utc)
                doc["timestamp"] = doc["timestamp"].isoformat()
            documents.append(doc)

        return documents

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
