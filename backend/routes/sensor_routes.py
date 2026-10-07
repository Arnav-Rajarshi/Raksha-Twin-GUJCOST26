from fastapi import APIRouter, HTTPException

from models.SensorReadingsModel import SensorReading,EnvironmentStateResponse,hazardEnum
from db.mongoDB import db
sensor_router=APIRouter()

@sensor_router.post("")
async def collect_sensor_data(data:SensorReading):
    document = data.model_dump()

    document["metadata"]={
        "robot_id":document["robot_id"],
        "mission_id":document["mission_id"]
    }

    document.pop("robot_id")
    document.pop("mission_id")

    await db.sensor_readings.insert_one(document)

    document.pop("_id",None)

    return {
        **document,
        "message":"Inserted latest sesnor readings"
    }

def evaluate_hazard(gas_value: float, temperature: float) -> str:
    # Example threshold rules
    if gas_value >= 1.0 or temperature >= 50.0 :
        return "CRITICAL"
    if gas_value >= 0.5 or temperature >= 40.0:
        return "WARNING"
    return "NORMAL"

@sensor_router.get("/latest/{robot_id}/{mission_id}",response_model=EnvironmentStateResponse)
async def send_latest_environment_state(robot_id: str,mission_id: str):

    document = await db.sensor_readings.find_one(
        {
            "metadata.robot_id": robot_id,
            "metadata.mission_id": mission_id
        },
        sort=[("timestamp", -1)]
    )

    if document is None:
        raise HTTPException(
            status_code=404,
            detail="No sensor readings found for this robot and mission"
        )

    document.pop("_id", None)

    ts = document["timestamp"]
    last_update_str = ts.isoformat() if hasattr(ts, "isoformat") else str(ts)

    hazard_string = evaluate_hazard(round(document["gas"]["value"],2), round(document["temperature"], 2), )
    return EnvironmentStateResponse(
        temperature=round(document["temperature"], 2),

        humidity=round(document["humidity"], 2),

        gas_value=round(document["gas"]["value"],2),

        range_m=round(document["range"]["front"],2),

        hazard_status= hazardEnum(hazard_string), # type: ignore

        last_update=last_update_str
    )