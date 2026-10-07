from db.mongoDB import db


async def create_indexes():
    # 1. missions: unique on mission_id
    await db.missions.create_index("mission_id", unique=True)

    # 2. detection_summary: allow historical snapshots while keeping newest-first lookup efficient
    detection_index_info = await db.detection_summary.index_information()
    legacy_compound_name = "robot_id_1_mission_id_1"
    if legacy_compound_name in detection_index_info:
        await db.detection_summary.drop_index(legacy_compound_name)

    await db.detection_summary.create_index("detection_summary_id", unique=True, sparse=True)
    await db.detection_summary.create_index([("robot_id", 1), ("mission_id", 1), ("updated_at", -1)])

    # 3. mission_events: indexed on mission_id and timestamp (newest first)
    await db.mission_events.create_index([("mission_id", 1), ("timestamp", -1)])

    # 4. alerts: unique on alert_id, and compound index on (mission_id, status)
    await db.alerts.create_index("alert_id", unique=True)
    await db.alerts.create_index([("mission_id", 1), ("status", 1)])

    # 5. nearby_services_cache: unique on service_id
    await db.nearby_services_cache.create_index("service_id", unique=True)
