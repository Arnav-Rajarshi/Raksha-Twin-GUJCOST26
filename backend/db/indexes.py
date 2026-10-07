from db.mongoDB import db

async def create_indexes():
    # 1. missions: unique on mission_id
    await db.missions.create_index("mission_id", unique=True)

    # 2. detection_summary: unique compound on (robot_id, mission_id)
    await db.detection_summary.create_index([("robot_id", 1), ("mission_id", 1)], unique=True)

    # 3. mission_events: indexed on mission_id and timestamp (newest first)
    await db.mission_events.create_index([("mission_id", 1), ("timestamp", -1)])

    # 4. alerts: unique on alert_id, and compound index on (mission_id, status)
    await db.alerts.create_index("alert_id", unique=True)
    await db.alerts.create_index([("mission_id", 1), ("status", 1)])

    # 5. nearby_services_cache: unique on service_id
    await db.nearby_services_cache.create_index("service_id", unique=True)