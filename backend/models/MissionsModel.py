from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel


class MissionCreate(BaseModel):
    mission_id: str
    name: str
    robot_id: str
    status: Literal["ACTIVE", "PAUSED", "COMPLETE"] = "ACTIVE"
    sector: str
    started_at: datetime | None = None


class MissionResponse(BaseModel):
    mission_id: str
    name: str
    robot_id: str = "RAKSHA-01"
    status: Literal["ACTIVE", "PAUSED", "COMPLETE"]
    sector: str
    started_at: str
    elapsed: str


class MissionSummaryResponse(BaseModel):
    mission_id: str
    name: str
    robot_id: str
    status: Literal["ACTIVE", "PAUSED", "COMPLETE"]
    sector: str
    started_at: str
    elapsed: str