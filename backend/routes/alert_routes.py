from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from typing import List
from models.AlertModel import AlertCreate, AlertResponse
from models.EventModel import GeoJSONPoint
from db.mongoDB import db

alert_router = APIRouter()


def transform_alert_doc(doc: dict) -> AlertResponse:
    ts = doc.get("timestamp")
    if isinstance(ts, datetime):
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        ts_str = ts.isoformat()
    elif isinstance(ts, str):
        ts_str = ts
    else:
        ts_str = datetime.now(timezone.utc).isoformat()

    resolved_at = doc.get("resolved_at")
    resolved_at_str = None
    if isinstance(resolved_at, datetime):
        if resolved_at.tzinfo is None:
            resolved_at = resolved_at.replace(tzinfo=timezone.utc)
        resolved_at_str = resolved_at.isoformat()
    elif isinstance(resolved_at, str):
        resolved_at_str = resolved_at

    loc = doc.get("location", {})
    coords = loc.get("coordinates", [0.0, 0.0])

    return AlertResponse(
        alert_id=str(doc.get("alert_id")),
        mission_id=str(doc.get("mission_id")),
        robot_id=str(doc.get("robot_id")),
        timestamp=ts_str,
        type=str(doc.get("type", "ALERT")),
        severity=doc.get("severity", "MEDIUM"),
        message=str(doc.get("message", "")),
        location=GeoJSONPoint(type="Point", coordinates=(float(coords[0]), float(coords[1]))),
        status=doc.get("status", "ACTIVE"),
        resolved_at=resolved_at_str,
    )


@alert_router.post("", response_model=dict)
async def create_alert(alert: AlertCreate):
    try:
        ts = alert.timestamp or datetime.now(timezone.utc)
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)

        doc = {
            "alert_id": alert.alert_id,
            "mission_id": alert.mission_id,
            "robot_id": alert.robot_id,
            "timestamp": ts,
            "type": alert.type,
            "severity": alert.severity,
            "message": alert.message,
            "location": {
                "type": "Point",
                "coordinates": list(alert.location.coordinates),
            },
            "status": alert.status,
            "resolved_at": alert.resolved_at,
        }

        await db.alerts.update_one(
            {"alert_id": alert.alert_id},
            {"$set": doc},
            upsert=True,
        )

        return {"message": "Alert created successfully.", "alert_id": alert.alert_id}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@alert_router.get("/{mission_id}", response_model=List[AlertResponse])
async def get_alerts_for_mission(mission_id: str):
    try:
        cursor = db.alerts.find({"mission_id": mission_id}).sort("timestamp", -1)
        alerts = []
        async for doc in cursor:
            alerts.append(transform_alert_doc(doc))
        return alerts

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@alert_router.patch("/{alert_id}/resolve", response_model=dict)
async def resolve_alert(alert_id: str):
    try:
        now = datetime.now(timezone.utc)
        result = await db.alerts.update_one(
            {"alert_id": alert_id},
            {"$set": {"status": "RESOLVED", "resolved_at": now}}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Alert not found")

        return {"message": "Alert resolved successfully.", "alert_id": alert_id, "resolved_at": now.isoformat()}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

