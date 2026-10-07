from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field


class Telemetry(BaseModel):
    robot_id: str
    mission_id: str
    timestamp: datetime
    latitude: float
    longitude: float
    altitude: float
    roll: float
    pitch: float
    yaw: float
    speed: float
    heading: float
    flight_mode: Optional[str] = "MANUAL"
    battery_voltage: Optional[float] = 12.6
    battery_current: Optional[float] = 1.5
    battery_remaining: float
    # GPS satellites count provided by Pixhawk GPS unit; default fallback if not yet transmitted
    gps_satellites: int = Field(default=16, description="GPS satellite count (Pixhawk / GNSS fix)")


# Enforce the nested location structure
class Location(BaseModel):
    latitude: float
    longitude: float
    altitude: float


# Enforce the nested orientation structure
class Orientation(BaseModel):
    roll: float
    pitch: float
    yaw: float


# Main RobotState model matching the TypeScript interface
class RobotStateResponse(BaseModel):
    robot_id: str
    mission_id: str
    location: Location
    speed: float
    heading: float
    orientation: Orientation
    mode: Literal["AERIAL", "GROUND"]
    battery_remaining: float
    connection_status: Literal["CONNECTED", "DISCONNECTED"]
    gps_satellites: int = 16
    last_update: str
