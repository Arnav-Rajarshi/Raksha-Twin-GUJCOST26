from pydantic import BaseModel 

class OpenMeteoResponseModel(BaseModel):
    latitude: float
    longitude: float

    observed_at: str
    
    surface_pressure: float
    temperature_2m: float
    relative_humidity_2m: float
    precipitation: float
    wind_speed_10m: float
    weather_code: float
    wind_direction_10m: float

