from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from models.DetectionModel import DetectionSummaryCreate, DetectionSummaryResponse, LatestDetection
from db.mongoDB import db

detection_router = APIRouter()


def transform_detection_doc(doc: dict) -> DetectionSummaryResponse:
    updated_at = doc.get("updated_at")
    if isinstance(updated_at, datetime):
        if updated_at.tzinfo is None:
            updated_at = updated_at.replace(tzinfo=timezone.utc)
        updated_at_str = updated_at.isoformat()
    elif isinstance(updated_at, str):
        updated_at_str = updated_at
    else:
        updated_at_str = datetime.now(timezone.utc).isoformat()

    ld = doc.get("latest_detection", {})
    ld_ts = ld.get("timestamp")
    if isinstance(ld_ts, datetime):
        if ld_ts.tzinfo is None:
            ld_ts = ld_ts.replace(tzinfo=timezone.utc)
        ld_ts_str = ld_ts.isoformat()
    elif isinstance(ld_ts, str):
        ld_ts_str = ld_ts
    else:
        ld_ts_str = updated_at_str

    latest_det = LatestDetection(
        type=str(ld.get("type", "NONE")),
        confidence=round(float(ld.get("confidence", 0.0)), 2),
        timestamp=ld_ts_str,
    )

    return DetectionSummaryResponse(
        person_count=int(doc.get("person_count", 0)),
        debris_count=int(doc.get("debris_count", 0)),
        obstacle_count=int(doc.get("obstacle_count", 0)),
        latest_detection=latest_det,
        updated_at=updated_at_str,
    )


@detection_router.post("", response_model=dict)
async def save_detection_summary(data: DetectionSummaryCreate):
    try:
        updated_at = data.updated_at or datetime.now(timezone.utc)
        if updated_at.tzinfo is None:
            updated_at = updated_at.replace(tzinfo=timezone.utc)

        doc = {
            "detection_summary_id": f"{data.robot_id}-{data.mission_id}-{updated_at.strftime('%Y%m%d%H%M%S%f')}",
            "robot_id": data.robot_id,
            "mission_id": data.mission_id,
            "person_count": data.person_count,
            "debris_count": data.debris_count,
            "obstacle_count": data.obstacle_count,
            "latest_detection": {
                "type": data.latest_detection.type,
                "confidence": data.latest_detection.confidence,
                "timestamp": data.latest_detection.timestamp,
            },
            "updated_at": updated_at,
        }

        await db.detection_summary.insert_one(doc)

        return {"message": "Detection summary updated successfully."}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@detection_router.get("/latest/{robot_id}/{mission_id}", response_model=DetectionSummaryResponse)
async def get_latest_detection_summary(robot_id: str, mission_id: str):
    try:
        doc = await db.detection_summary.find_one(
            {
                "robot_id": robot_id,
                "mission_id": mission_id,
            },
            sort=[("updated_at", -1), ("latest_detection.timestamp", -1)],
        )

        if doc is None:
            raise HTTPException(
                status_code=404,
                detail="No detection summary found for this robot and mission",
            )

        return transform_detection_doc(doc)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

