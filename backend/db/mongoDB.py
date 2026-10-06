from pymongo import AsyncMongoClient
from db.settings import settings

client = AsyncMongoClient(settings.DB_CONNECTION)
db = client["Raksha-Twin-Local"]  # means name of the database 