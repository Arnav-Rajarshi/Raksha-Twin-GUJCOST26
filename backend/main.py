from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.mongoDB import client


from db.setup import create_collections
from routes.missions_routes import missions_router
from routes.openMeteo_routes import map_router
from routes.telemetry_routes import telemetry_router
from routes.sensor_routes import sensor_router

#-----------------------------------------------------------------------------------
#-- New concept :- ContextManager --#
from db.indexes import create_indexes
from contextlib import asynccontextmanager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. SETUP (Runs BEFORE your API accepts any traffic)
    await create_collections()  # Ensure collections are created before the API starts
    await create_indexes()

    yield  # 2. PAUSE (The API is now running and serving requests)

    # 3. TEARDOWN (Runs AFTER the server stops / shuts down)
    # (e.g., await client.close())
#-----------------------------------------------------------------------------------


app = FastAPI(
    lifespan=lifespan, # NEW ARGUMENT ADDED BECAUSE OF THE CONTEXT MANAGER 
    # In modern FastAPI, the application lifespan is managed as a context manager
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


@app.get("/health") # checking connection with backend and mongodb
async def health_check():

    await client.admin.command("ping")

    return {
        "status": "ok",
        "mongodb": "connected"
    }



app.include_router(router=map_router, prefix="/api/openmeteo") 
app.include_router(router=missions_router, prefix="/missions")
app.include_router(router=telemetry_router, prefix="/telemetry")
app.include_router(router=sensor_router, prefix="/sensor")