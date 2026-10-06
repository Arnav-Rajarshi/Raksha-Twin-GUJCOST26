# this keeps the openMeteo responsible for only communicating with openMeteo 
import datetime

from services.OpenMeteo_service import fetch_openmeteo_data
from services.robot_service import get_robot_location

def transform_weather_data(OpenMeteoResponseModel)-> dict:
    """
    export interface WeatherState {
        location: { latitude: number; longitude: number };
        source: "IMD";
        fetched_at: string;
        observed_at: string;
        current: {
            temperature_c: number;
            humidity_percent: number;
            wind_speed_kmph: number;
            wind_direction: number;
            pressure_hpa: number;
            rainfall_24h_mm: number;
            weather_code: number;
        };
        warnings: string[];
    }

    """
    return {
        "location": {
            "latitude": OpenMeteoResponseModel.latitude,
            "longitude": OpenMeteoResponseModel.longitude
        },

        "source": "Open-Meteo",

        "fetched_at": OpenMeteoResponseModel.observed_at, # this is the time when the data was fetched from openMeteo

        "observed_at": datetime.datetime.astimezone,

        "current": {
            "temperature_c": OpenMeteoResponseModel.temperature_2m,
            "humidity_percent": OpenMeteoResponseModel.relative_humidity_2m,
            "wind_speed_kmph": OpenMeteoResponseModel.wind_speed_10m,
            "wind_direction": OpenMeteoResponseModel.wind_direction_10m,
            "pressure_hpa": OpenMeteoResponseModel.surface_pressure,
            "rainfall_24h_mm": OpenMeteoResponseModel.precipitation,
            "weather_code": OpenMeteoResponseModel.weather_code
        },

        "warnings": []
    }

    
def refresh_weather():

    location = get_robot_location()

    raw_weather = fetch_openmeteo_data(location["latitude"],location["longitude"])

    weather = transform_weather_data(raw_weather)

    weather_cache = weather

    return weather