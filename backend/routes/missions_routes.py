from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone

from models.MissionsModel import MissionCreate, MissionResponse
from db.mongoDB import db

missions_router = APIRouter()


def format_elapsed(started_at: datetime, ended_at: datetime | None = None) -> str:
    if started_at.tzinfo is None:
        started_at = started_at.replace(tzinfo=timezone.utc)

    end_time = ended_at if ended_at else datetime.now(timezone.utc)
    if end_time.tzinfo is None:
        end_time = end_time.replace(tzinfo=timezone.utc)

    total_seconds = max(0, int((end_time - started_at).total_seconds()))
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    seconds = total_seconds % 60
    return f"{hours:02d}:{minutes:02d}:{seconds:02d}"


def transform_mission_doc(doc: dict) -> MissionResponse:
    started_at = doc.get("started_at")
    if isinstance(started_at, str):
        try:
            started_at_dt = datetime.fromisoformat(started_at)
        except Exception:
            started_at_dt = datetime.now(timezone.utc)
    elif isinstance(started_at, datetime):
        started_at_dt = started_at
    else:
        started_at_dt = datetime.now(timezone.utc)

    if started_at_dt.tzinfo is None:
        started_at_dt = started_at_dt.replace(tzinfo=timezone.utc)

    ended_at = doc.get("ended_at")
    if isinstance(ended_at, str):
        try:
            ended_at_dt = datetime.fromisoformat(ended_at)
        except Exception:
            ended_at_dt = None
    elif isinstance(ended_at, datetime):
        ended_at_dt = ended_at
    else:
        ended_at_dt = None

    elapsed = format_elapsed(started_at_dt, ended_at_dt)

    status = doc.get("status", "ACTIVE")
    if status == "deactivated":
        status = "COMPLETE"
    elif status not in ["ACTIVE", "PAUSED", "COMPLETE"]:
        status = "ACTIVE"

    return MissionResponse(
        mission_id=doc["mission_id"],
        name=doc.get("name", "Mission"),
        status=status,
        sector=doc.get("sector", "Sector 01"),
        started_at=started_at_dt.isoformat(),
        elapsed=elapsed,
    )


@missions_router.post("/create_mission")
async def post_mission(mission: MissionCreate):
    try:
        started_at = mission.started_at or datetime.now(timezone.utc)
        if started_at.tzinfo is None:
            started_at = started_at.replace(tzinfo=timezone.utc)

        document = {
            "mission_id": mission.mission_id,
            "name": mission.name,
            "robot_id": mission.robot_id,
            "status": mission.status,
            "sector": mission.sector,
            "started_at": started_at,
            "ended_at": None,
        }

        await db.missions.update_one(
            {"mission_id": mission.mission_id},
            {"$set": document},
            upsert=True,
        )

        return {
            "mission_id": mission.mission_id,
            "status": mission.status,
            "message": "Mission created successfully.",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@missions_router.get("/get_mission/{mission_id}", response_model=MissionResponse)
async def get_mission(mission_id: str):
    try:
        mission = await db.missions.find_one({"mission_id": mission_id})
        if mission is None:
            raise HTTPException(status_code=404, detail="Mission not found")
        return transform_mission_doc(mission)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@missions_router.put("/deactivate_mission/{mission_id}")
async def deactivate_mission(mission_id: str):
    try:
        result = await db.missions.update_one(
            {"mission_id": mission_id},
            {"$set": {"status": "COMPLETE", "ended_at": datetime.now(timezone.utc)}},
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Mission not found")
        return {"message": "Mission completed successfully."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
