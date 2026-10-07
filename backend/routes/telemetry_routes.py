from fastapi import APIRouter, HTTPException
from datetime import datetime,timezone

from services.telementry_service import transform_into_robot_snapshot
from models.TelemetryModel import Telemetry
from db.mongoDB import db


telemetry_router = APIRouter()


@telemetry_router.post("")
async def save_latest_telemetry_data(data:Telemetry):
    try:
        document = data.model_dump()

        document["metadata"] = {
            "robot_id": data.robot_id,
            "mission_id": data.mission_id
        }

        document.pop("robot_id")
        document.pop("mission_id")
        
        await db.telemetry.insert_one(document)

        document.pop("_id",None)
        return {
            **document,
            "message": "Telemetry data saved successfully."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@telemetry_router.get("/latest/{robot_id}/{mission_id}")
async def get_telemetry_data(robot_id: str, mission_id: str):
    try:
        document = await db.telemetry.find_one({
            "metadata.robot_id": robot_id,
            "metadata.mission_id": mission_id
        }, 
        sort = [("timestamp",-1)]) # Sort by timestamp in descending order to get the latest document
        
        if document is None:
            raise HTTPException(
                status_code=404,
                detail="No telemetry found for this robot and mission"
            )

        document.pop("_id", None)  # type: ignore 
        # Remove the '_id' field from the response
        return transform_into_robot_snapshot(document) # type: ignore
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@telemetry_router.get("/records/{robot_id}/{mission_id}")
async def get_telemetry_records(robot_id: str, mission_id: str):
    try:
        cursor = db.telemetry.find({
            "metadata.robot_id": robot_id,
            "metadata.mission_id": mission_id
        }).sort("timestamp", -1)  # Sort by timestamp in descending order

        documents = []
        async for doc in cursor:
            doc.pop("_id", None)  # type: ignore # Remove the '_id' field from the response
            documents.append(doc)

        return list(documents) # type: ignore
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

