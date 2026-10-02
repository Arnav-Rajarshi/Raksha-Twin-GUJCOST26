from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routes.openMeteo_routes import MapRoutes

app = FastAPI(
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


app.include_router(router=MapRoutes, prefix="/api/openmeteo") 

