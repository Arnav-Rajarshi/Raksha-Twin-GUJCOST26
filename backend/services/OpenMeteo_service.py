import openmeteo_requests

import pandas as pd
import requests_cache
from retry_requests import retry

from models.OpenMeteoModel import OpenMeteoResponseModel

# Setup the Open-Meteo API client with cache and retry on error
cache_session = requests_cache.CachedSession('.cache', expire_after = 3600)
retry_session = retry(cache_session, retries = 5, backoff_factor = 0.2)
openmeteo = openmeteo_requests.Client(session = retry_session) # type: ignore

# Make sure all required weather variables are listed here
# The order of variables in hourly or daily is important to assign them correctly below
url = "https://api.open-meteo.com/v1/forecast"
def fetch_openmeteo_data(latitude:float,longitude:float) -> OpenMeteoResponseModel:
	params = {
		"latitude": latitude,
		"longitude": longitude,
		"current": ["surface_pressure", "temperature_2m", "relative_humidity_2m", "precipitation", "wind_speed_10m", "weather_code", "wind_direction_10m"],
		"timezone": "auto",
	}
	responses = openmeteo.weather_api(url, params = params)

	# Process first location. Add a for-loop for multiple locations or weather models
	response = responses[0]
	"""
	print(f"Coordinates: {response.Latitude()}°N {response.Longitude()}°E")
	print(f"Elevation: {response.Elevation()} m asl")
	print(f"Timezone: {response.Timezone()}{response.TimezoneAbbreviation()}")
	print(f"Timezone difference to GMT+0: {response.UtcOffsetSeconds()}s")
	"""

	# Process current data. The order of variables needs to be the same as requested.
	current = response.Current()
	assert current is not None, "Current time is None"
	
	current_surface_pressure = current.Variables(0).Value() # type: ignore
	current_temperature_2m = current.Variables(1).Value() # type: ignore
	current_relative_humidity_2m = current.Variables(2).Value() # type: ignore
	current_precipitation = current.Variables(3).Value() # type: ignore
	current_wind_speed_10m = current.Variables(4).Value() # type: ignore
	current_weather_code = current.Variables(5).Value() # type: ignore
	current_wind_direction_10m = current.Variables(6).Value() # type: ignore

	"""
	print(f"Current time: {current.Time()}")
	print(f"Current surface_pressure: {current_surface_pressure}")
	print(f"Current temperature_2m: {current_temperature_2m}")
	print(f"Current relative_humidity_2m: {current_relative_humidity_2m}")
	print(f"Current precipitation: {current_precipitation}")
	print(f"Current wind_speed_10m: {current_wind_speed_10m}")
	print(f"Current weather_code: {current_weather_code}")
	print(f"Current wind_direction_10m: {current_wind_direction_10m}")
	"""

	return OpenMeteoResponseModel(
		latitude=response.Latitude(),
    	longitude=response.Longitude(),

   		observed_at=str(current.Time()),
           
		surface_pressure=current_surface_pressure,
		temperature_2m=current_temperature_2m,
		relative_humidity_2m=current_relative_humidity_2m,
		precipitation=current_precipitation,
		wind_speed_10m=current_wind_speed_10m,
		weather_code=current_weather_code,
		wind_direction_10m=current_wind_direction_10m
	)


#print(fetch_openmeteo_data(35.25, 75.71).model_dump())