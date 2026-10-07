from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone

from models.SensorReadingsModel import SensorReading, EnvironmentStateResponse
from db.settings import settings
from db.mongoDB import db

sensor_router = APIRouter()


def evaluate_hazard(gas_value: float, temperature: float) -> str:
    if gas_value >= settings.GAS_CRITICAL_THRESHOLD or temperature >= settings.TEMP_CRITICAL_THRESHOLD:
        return "CRITICAL"
    if gas_value >= settings.GAS_WARNING_THRESHOLD or temperature >= settings.TEMP_WARNING_THRESHOLD:
        return "WARNING"
    return "NORMAL"


def transform_sensor_doc(document: dict) -> EnvironmentStateResponse:
    ts = document.get("timestamp")
    if isinstance(ts, str):
        try:
            ts_dt = datetime.fromisoformat(ts)
        except Exception:
            ts_dt = datetime.now(timezone.utc)
    elif isinstance(ts, datetime):
        ts_dt = ts
    else:
        ts_dt = datetime.now(timezone.utc)

    if ts_dt.tzinfo is None:
        ts_dt = ts_dt.replace(tzinfo=timezone.utc)

    last_update_str = ts_dt.isoformat()

    # Extract gas value
    gas_data = document.get("gas", {})
    if isinstance(gas_data, dict):
        gas_val = float(gas_data.get("value", 0.0))
    elif isinstance(gas_data, (int, float)):
        gas_val = float(gas_data)
    else:
        gas_val = float(document.get("gas_value", 0.0))

    # Extract front range (range_m)
    range_data = document.get("range", {})
    if isinstance(range_data, dict):
        range_val = float(range_data.get("front", 0.0))
    elif isinstance(range_data, (int, float)):
        range_val = float(range_data)
    else:
        range_val = float(document.get("range_m", 0.0))

    temp_val = float(document.get("temperature", 0.0))
    humidity_val = float(document.get("humidity", 0.0))

    hazard_string = evaluate_hazard(round(gas_val, 2), round(temp_val, 2))

    return EnvironmentStateResponse(
        temperature=round(temp_val, 1),
        humidity=round(humidity_val, 1),
        gas_value=round(gas_val, 2),
        range_m=round(range_val, 1),
        hazard_status=hazard_string,  # type: ignore
        last_update=last_update_str,
    )


@sensor_router.post("")
async def collect_sensor_data(data: SensorReading):
    try:
        document = data.model_dump()

        document["metadata"] = {
            "robot_id": data.robot_id,
            "mission_id": data.mission_id,
        }

        document.pop("robot_id", None)
        document.pop("mission_id", None)

        if document.get("timestamp") and document["timestamp"].tzinfo is None:
            document["timestamp"] = document["timestamp"].replace(tzinfo=timezone.utc)

        await db.sensor_readings.insert_one(document)

        document.pop("_id", None)

        return {
            "robot_id": data.robot_id,
            "mission_id": data.mission_id,
            "timestamp": document["timestamp"].isoformat() if isinstance(document["timestamp"], datetime) else str(document["timestamp"]),
            "message": "Inserted latest sensor readings",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@sensor_router.get("/latest/{robot_id}/{mission_id}", response_model=EnvironmentStateResponse)
async def send_latest_environment_state(robot_id: str, mission_id: str):
    try:
        document = await db.sensor_readings.find_one(
            {
                "metadata.robot_id": robot_id,
                "metadata.mission_id": mission_id,
            },
            sort=[("timestamp", -1)],
        )

        if document is None:
            raise HTTPException(
                status_code=404,
                detail="No sensor readings found for this robot and mission",
            )

        document.pop("_id", None)
        return transform_sensor_doc(document)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))