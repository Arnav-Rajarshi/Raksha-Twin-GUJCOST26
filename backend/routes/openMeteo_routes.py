from fastapi import APIRouter , HTTPException
from services.OpenMeteo_service import fetch_openmeteo_data
from services.weather_service import refresh_weather

map_router = APIRouter()


@map_router.get("/current_weather_data")
async def get_openmeteo_data():
    try:
        return refresh_weather()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))