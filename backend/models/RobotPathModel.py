from typing import List, Tuple, Literal
from pydantic import BaseModel


class GeoJSONLineString(BaseModel):
    type: Literal["LineString"] = "LineString"
    coordinates: List[Tuple[float, float]]  # [longitude, latitude]


class RobotPathResponse(BaseModel):
    robot_id: str
    mission_id: str
    path: GeoJSONLineString
    start_time: str
    last_updated: str

