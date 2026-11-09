

from app.config import settings


TTL = settings.tool_cache_ttl

class ExactCache():
    def __init__(self):
        self.ttl = TTL

    def make_hash(self):
        pass

    def get(self):
        pass

    