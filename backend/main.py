from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from db.mongoDB import client
from db.setup import create_collections
from db.indexes import create_indexes

from routes.missions_routes import missions_router
from routes.openMeteo_routes import map_router
from routes.telemetry_routes import telemetry_router
from routes.sensor_routes import sensor_router
from routes.detection_routes import detection_router
from routes.event_routes import event_router
from routes.alert_routes import alert_router
from routes.nearby_services_routes import nearby_services_router
from routes.dashboard_routes import dashboard_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. SETUP (Runs BEFORE API accepts any traffic)
    await create_collections()  # Ensure time-series collections exist
    await create_indexes()      # Ensure all required indexes exist

    yield

    # 3. TEARDOWN
    # await client.close()


app = FastAPI(
    lifespan=lifespan,
    title="Raksha Twin Dashboard Backend",
    metadata={"version": "1.0.0"},
    description="Backend API for the Raksha Twin Dashboard application."
)

# Allow CORS for the frontend application
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Welcome to the Raksha Twin Dashboard Backend API!"}


@app.get("/health")
async def health_check():
    await client.admin.command("ping")
    return {
        "status": "ok",
        "mongodb": "connected"
    }


# Include all routers
app.include_router(router=map_router, prefix="/api/openmeteo")
app.include_router(router=missions_router, prefix="/missions")
app.include_router(router=telemetry_router, prefix="/telemetry")
app.include_router(router=sensor_router, prefix="/sensor")
app.include_router(router=detection_router, prefix="/detections")
app.include_router(router=event_router, prefix="/events")
app.include_router(router=alert_router, prefix="/alerts")
app.include_router(router=nearby_services_router, prefix="/nearby-services")
app.include_router(router=dashboard_router, prefix="/dashboard")