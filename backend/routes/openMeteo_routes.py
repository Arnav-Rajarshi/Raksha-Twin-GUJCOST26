from fastapi import APIRouter , HTTPException
from backend.services.OpenMeteo_service import fetch_openmeteo_data
MapRoutes = APIRouter()


@MapRoutes.get("/openmeteo")
async def get_openmeteo_data():
    try:

        latitude =  31.25 # replace with logic to import from the robot 
        longitude = 75.71 

        data = fetch_openmeteo_data(latitude,longitude)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))