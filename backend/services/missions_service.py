from datetime import datetime,timezone

from models.MissionsModel import MissionCreate

from db.mongoDB import db

async def create_mission(mission: MissionCreate):
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

# im not gonna overcomplicate the matter for basic crud operations !