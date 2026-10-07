from datetime import datetime

from pydantic import BaseModel

from enum import Enum

class SensorReading(BaseModel):

    robot_id: str
    mission_id: str

    timestamp: datetime

    temperature: float
    humidity: float

    gas: dict

    range: dict

class hazardEnum(str, Enum):
    NORMAL = "NORMAL"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"

class EnvironmentStateResponse(BaseModel):
        temperature: float
        humidity: float
        gas_value: float
        range_m: float
        hazard_status: hazardEnum
        last_update: str
        