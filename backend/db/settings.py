from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env.local", extra="ignore")
    DB_CONNECTION: str = "mongodb://localhost:27017/Raksha-Twin-Local"
    
    # Altitude threshold to determine AERIAL vs GROUND mode (in meters)
    AERIAL_ALTITUDE_THRESHOLD_M: float = 10.0
    
    # Telemetry freshness timeout (in seconds) to determine connection status
    TELEMETRY_CONNECTION_TIMEOUT_SECONDS: float = 5.0
    
    # Environmental sensor hazard thresholds
    GAS_CRITICAL_THRESHOLD: float = 1.0
    GAS_WARNING_THRESHOLD: float = 0.5
    TEMP_CRITICAL_THRESHOLD: float = 50.0
    TEMP_WARNING_THRESHOLD: float = 40.0

settings = Settings() # type: ignore