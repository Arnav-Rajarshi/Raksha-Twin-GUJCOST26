from typing import Literal
from pydantic import BaseModel


class LatLng(BaseModel):
    latitude: float
    longitude: float


class NearbyServiceCreate(BaseModel):
    service_id: str
    category: Literal["HOSPITAL", "FIRE_STATION", "POLICE", "SHELTER"]
    name: str
    location: LatLng
    distance_km: float


class NearbyServiceResponse(BaseModel):
    service_id: str
    category: Literal["HOSPITAL", "FIRE_STATION", "POLICE", "SHELTER"]
    name: str
    location: LatLng
    distance_km: float

