from datetime import datetime
from pydantic import BaseModel


class MissionCreate(BaseModel):
    mission_id: str
    name: str
    robot_id: str
    status: str = "ACTIVE"
    sector: str