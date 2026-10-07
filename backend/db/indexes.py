from db.mongoDB import db

async def create_indexes():
    # Create an index on the 'mission_id' field to ensure uniqueness
    await db.missions.create_index("mission_id", unique=True)