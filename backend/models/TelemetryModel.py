from datetime import datetime

from pydantic import BaseModel


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

    flight_mode: str

    battery_voltage: float
    battery_current: float
    battery_remaining: float


from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field


# 1. Enforce the nested location structure
class Location(BaseModel):
    latitude: float
    longitude: float
    altitude: float


# 2. Enforce the nested orientation structure
class Orientation(BaseModel):
    roll: float
    pitch: float
    yaw: float


# 3. Main RobotState model matching your TypeScript interface
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
    gps_satellites: int = Field(default=0)
    last_update: datetime
