from fastapi import APIRouter, HTTPException
from datetime import datetime,timezone

from services.missions_service import create_mission
from models.MissionsModel import MissionCreate
from db.mongoDB import db

missions_router = APIRouter()

@missions_router.post("/create_mission")
async def post_mission(mission:MissionCreate):
        document = {
            "mission_id": mission.mission_id,
            "name": mission.name,
            "robot_id": mission.robot_id,
            "status": mission.status,
            "sector": mission.sector,
            "started_at": datetime.now(timezone.utc),
            "ended_at": None,
        }

        result = await db.missions.insert_one(document)
        print(document)
        # document now has an '_id' ObjectId field attached by MongoDB
        # because mongoDB manipulates the very object passed into it 
        document["_id"] = str(document["_id"])
        return {**document, "message": "Mission created successfully."}

@missions_router.get("/get_mission/{mission_id}")
async def get_mission(mission_id: str):
    try:
        mission = await db.missions.find_one({"mission_id": mission_id})
        if mission is None:
            raise HTTPException(status_code=404, detail="Mission not found")
        mission.pop("_id", None)  # Remove the '_id' field from the response
        return mission
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@missions_router.put("/deactivate_mission/{mission_id}")
async def deactivate_mission(mission_id: str):
    try:
          result = await db.missions.update_one(
               {"mission_id":mission_id},
               {"$set":{"status":"deactivated","ended_at":datetime.now(timezone.utc)}}
          )
          if result.matched_count == 0:
               raise HTTPException(status_code=404, detail="Mission not found")
          return {"message": "Mission deactivated successfully."}
    except Exception as e:
          raise HTTPException(status_code=500, detail=str(e))
