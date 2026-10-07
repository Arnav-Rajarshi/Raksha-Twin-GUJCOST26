from datetime import datetime
from typing import Literal, Tuple, Optional
from pydantic import BaseModel
from models.EventModel import GeoJSONPoint


class AlertCreate(BaseModel):
    alert_id: str
    mission_id: str
    robot_id: str
    timestamp: Optional[datetime] = None
    type: str
    severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    message: str
    location: GeoJSONPoint
    status: Literal["ACTIVE", "RESOLVED"] = "ACTIVE"
    resolved_at: Optional[datetime] = None


class AlertResponse(BaseModel):
    alert_id: str
    mission_id: str
    robot_id: str
    timestamp: str
    type: str
    severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    message: str
    location: GeoJSONPoint
    status: Literal["ACTIVE", "RESOLVED"]
    resolved_at: Optional[str] = None

