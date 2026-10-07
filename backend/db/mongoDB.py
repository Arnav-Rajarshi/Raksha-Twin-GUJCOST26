from pymongo import AsyncMongoClient
from db.settings import settings


class LazyAsyncMongoClient:
    def __init__(self):
        self._client = None

    def _ensure_client(self):
        if self._client is None:
            self._client = AsyncMongoClient(settings.DB_CONNECTION)
        return self._client

    async def close(self):
        if self._client is not None:
            await self._client.close()
            self._client = None

    def __getattr__(self, name):
        return getattr(self._ensure_client(), name)

    def __getitem__(self, key):
        return self._ensure_client()[key]


class LazyDatabase:
    def __init__(self):
        self._db = None

    def _ensure_db(self):
        if self._db is None:
            self._db = client["Raksha-Twin-Local"]
        return self._db

    def __getattr__(self, name):
        return getattr(self._ensure_db(), name)

    def __getitem__(self, key):
        return self._ensure_db()[key]

    async def close(self):
        await client.close()


client = LazyAsyncMongoClient()
db = LazyDatabase()  # means name of the database 