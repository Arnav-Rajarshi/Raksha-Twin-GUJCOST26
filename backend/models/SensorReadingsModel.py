from datetime import datetime
from typing import Literal, Optional, Any, Dict
from pydantic import BaseModel, Field


class GasSensorData(BaseModel):
    sensor_id: Optional[str] = "GAS-01"
    value: float
    unit: Optional[str] = "ppm"


class RangeSensorData(BaseModel):
    front: float
    left: Optional[float] = None
    right: Optional[float] = None


class SensorReading(BaseModel):
    robot_id: str
    mission_id: str
    timestamp: datetime
    temperature: float
    humidity: float
    gas: Dict[str, Any] | GasSensorData
    range: Dict[str, Any] | RangeSensorData


class EnvironmentStateResponse(BaseModel):
    temperature: float
    humidity: float
    gas_value: float
    range_m: float
    hazard_status: Literal["NORMAL", "WARNING", "CRITICAL"]
    last_update: str