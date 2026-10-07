from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class LatestDetection(BaseModel):
    type: str
    confidence: float
    timestamp: str


class DetectionSummaryCreate(BaseModel):
    robot_id: str
    mission_id: str
    person_count: int = 0
    debris_count: int = 0
    obstacle_count: int = 0
    latest_detection: LatestDetection
    updated_at: Optional[datetime] = None


class DetectionSummaryResponse(BaseModel):
    person_count: int
    debris_count: int
    obstacle_count: int
    latest_detection: LatestDetection
    updated_at: str

