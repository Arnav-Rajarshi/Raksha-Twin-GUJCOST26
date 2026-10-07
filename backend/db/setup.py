from db.mongoDB import db

async def create_collections():

    list_of_collections = await db.list_collection_names()
    if "telemetry" not in list_of_collections:

        await db.create_collection(
            name="telemetry",
            timeseries={
                "timeField": "timestamp",
                "metaField": "metadata",
                "granularity": "seconds"
            }
        )

    if "sensor_readings" not in list_of_collections:

        await db.create_collection(
            "sensor_readings",
            timeseries={
                "timeField": "timestamp",
                "metaField": "metadata",
                "granularity": "seconds"
            }
        )
        