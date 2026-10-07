from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from typing import List
from models.EventModel import MissionEventCreate, MissionEventResponse, GeoJSONPoint
from db.mongoDB import db

event_router = APIRouter()


def transform_event_doc(doc: dict) -> MissionEventResponse:
    ts = doc.get("timestamp")
    if isinstance(ts, datetime):
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        ts_str = ts.isoformat()
    elif isinstance(ts, str):
        ts_str = ts
    else:
        ts_str = datetime.now(timezone.utc).isoformat()

    loc = doc.get("location", {})
    coords = loc.get("coordinates", [0.0, 0.0])

    return MissionEventResponse(
        event_id=str(doc.get("event_id")),
        mission_id=str(doc.get("mission_id")),
        robot_id=str(doc.get("robot_id")),
        timestamp=ts_str,
        event_type=str(doc.get("event_type")),
        severity=doc.get("severity", "LOW"),
        source=str(doc.get("source", "SYSTEM")),
        message=str(doc.get("message", "")),
        location=GeoJSONPoint(type="Point", coordinates=(float(coords[0]), float(coords[1]))),
        metadata=doc.get("metadata", {}),
    )


@event_router.post("", response_model=dict)
async def create_mission_event(event: MissionEventCreate):
    try:
        ts = event.timestamp or datetime.now(timezone.utc)
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)

        doc = {
            "event_id": event.event_id,
            "mission_id": event.mission_id,
            "robot_id": event.robot_id,
            "timestamp": ts,
            "event_type": event.event_type,
            "severity": event.severity,
            "source": event.source,
            "message": event.message,
            "location": {
                "type": "Point",
                "coordinates": list(event.location.coordinates),
            },
            "metadata": event.metadata,
        }

        await db.mission_events.update_one(
            {"event_id": event.event_id},
            {"$set": doc},
            upsert=True,
        )

        return {"message": "Mission event recorded successfully.", "event_id": event.event_id}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@event_router.get("/{mission_id}", response_model=List[MissionEventResponse])
async def get_mission_events(mission_id: str):
    try:
        cursor = db.mission_events.find({"mission_id": mission_id}).sort("timestamp", -1)
        events = []
        async for doc in cursor:
            events.append(transform_event_doc(doc))
        return events

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

