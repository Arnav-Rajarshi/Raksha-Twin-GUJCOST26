from datetime import datetime
from typing import Literal, Tuple, Dict, Any, Union, Optional
from pydantic import BaseModel


class GeoJSONPoint(BaseModel):
    type: Literal["Point"] = "Point"
    coordinates: Tuple[float, float]  # [longitude, latitude]


class MissionEventCreate(BaseModel):
    event_id: str
    mission_id: str
    robot_id: str
    timestamp: Optional[datetime] = None
    event_type: str
    severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    source: str
    message: str
    location: GeoJSONPoint
    metadata: Dict[str, Union[int, float, str]] = {}


class MissionEventResponse(BaseModel):
    event_id: str
    mission_id: str
    robot_id: str
    timestamp: str
    event_type: str
    severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    source: str
    message: str
    location: GeoJSONPoint
    metadata: Dict[str, Union[int, float, str]]

