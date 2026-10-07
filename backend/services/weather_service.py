from datetime import datetime, timezone

from services.OpenMeteo_service import fetch_openmeteo_data
from services.robot_service import get_robot_location


def transform_weather_data(openmeteo_response) -> dict:
    """
    Transform Open-Meteo response into the frontend WeatherState format.
    """

    # Open-Meteo current.Time() is Unix timestamp in seconds
    observed_timestamp = int(openmeteo_response.observed_at)

    observed_at = datetime.fromtimestamp(
        observed_timestamp,
        tz=timezone.utc
    ).isoformat()

    # Time at which our backend fetched the weather data
    fetched_at = datetime.now(timezone.utc).isoformat()

    return {
        "location": {
            "latitude": openmeteo_response.latitude,
            "longitude": openmeteo_response.longitude
        },

        "source": "Open-Meteo",

        "fetched_at": fetched_at,

        "observed_at": observed_at,

        "current": {
            "temperature_c": openmeteo_response.temperature_2m,
            "humidity_percent": openmeteo_response.relative_humidity_2m,
            "wind_speed_kmph": openmeteo_response.wind_speed_10m,
            "wind_direction": openmeteo_response.wind_direction_10m,
            "pressure_hpa": openmeteo_response.surface_pressure,
            "rainfall_24h_mm": openmeteo_response.precipitation,
            "weather_code": openmeteo_response.weather_code
        },

        "warnings": []
    }


def refresh_weather():

    location = get_robot_location()

    raw_weather = fetch_openmeteo_data(
        location["latitude"],
        location["longitude"]
    )

    weather = transform_weather_data(raw_weather)

    return weather