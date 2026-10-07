
from datetime import datetime, timezone

from models.TelemetryModel import Location, Orientation, RobotStateResponse

AERIAL_ALTITUDE_THRESHOLD_M=10

def transform_into_robot_snapshot(Telemetry:dict)-> RobotStateResponse:
    
    last_update = Telemetry["timestamp"]

    #solves the data is timezone aware or not problem 
    if last_update.tzinfo is None:
        last_update = last_update.replace(tzinfo=timezone.utc)

    # Determine whether Telemetry is still fresh.
    age = (
        datetime.now(timezone.utc) - last_update
    ).total_seconds() # type: ignore

    connection_status = (
        "CONNECTED"
        if age <= 5
        else "DISCONNECTED"
    )

    global MODE 
    if Telemetry["altitude"]>=AERIAL_ALTITUDE_THRESHOLD_M:
        MODE= "AERIAL"
    else:
        MODE = "GROUND"
    
    return RobotStateResponse(
        robot_id= Telemetry["metadata"]["robot_id"],

        mission_id= Telemetry["metadata"]["mission_id"],

        location= Location(
            latitude= Telemetry["latitude"],
            longitude= Telemetry["longitude"],
            altitude= Telemetry["altitude"],
        ),

        speed= Telemetry["speed"],

        heading= Telemetry["heading"],

        orientation= Orientation(
            roll= Telemetry["roll"],
            pitch= Telemetry["pitch"],
            yaw= Telemetry["yaw"],
        ),

        mode= MODE,  # type: ignore

        battery_remaining= Telemetry["battery_remaining"],

        connection_status= connection_status,

        last_update= last_update,
    )
