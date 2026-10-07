from fastapi import APIRouter, HTTPException
from typing import List
from models.NearbyServiceModel import NearbyServiceCreate, NearbyServiceResponse, LatLng
from db.mongoDB import db

nearby_services_router = APIRouter()


def transform_nearby_service_doc(doc: dict) -> NearbyServiceResponse:
    loc = doc.get("location", {})
    return NearbyServiceResponse(
        service_id=str(doc.get("service_id")),
        category=doc.get("category", "HOSPITAL"),
        name=str(doc.get("name")),
        location=LatLng(
            latitude=float(loc.get("latitude", 0.0)),
            longitude=float(loc.get("longitude", 0.0)),
        ),
        distance_km=round(float(doc.get("distance_km", 0.0)), 1),
    )


@nearby_services_router.post("", response_model=dict)
async def add_nearby_service(service: NearbyServiceCreate):
    try:
        doc = {
            "service_id": service.service_id,
            "category": service.category,
            "name": service.name,
            "location": {
                "latitude": service.location.latitude,
                "longitude": service.location.longitude,
            },
            "distance_km": service.distance_km,
        }

        await db.nearby_services_cache.update_one(
            {"service_id": service.service_id},
            {"$set": doc},
            upsert=True,
        )

        return {"message": "Nearby service recorded successfully.", "service_id": service.service_id}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@nearby_services_router.get("", response_model=List[NearbyServiceResponse])
async def get_nearby_services():
    try:
        cursor = db.nearby_services_cache.find({}).sort("distance_km", 1)
        services = []
        async for doc in cursor:
            services.append(transform_nearby_service_doc(doc))
        return services

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

