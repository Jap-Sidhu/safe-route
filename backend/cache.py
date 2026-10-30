"""Cache backends.

Production uses Redis (e.g. Upstash) through REDIS_URL. Without it, an in-process
memory cache with the same small interface keeps local development dependency-free.
"""

import json
import logging
import threading
import time
from typing import Any, Optional

log = logging.getLogger(__name__)


class MemoryCache:
    name = "memory"

    def __init__(self) -> None:
        self._data: dict[str, tuple[str, Optional[float]]] = {}
        self._lock = threading.Lock()

    def _alive(self, key: str) -> Optional[str]:
        item = self._data.get(key)
        if item is None:
            return None
        value, expires = item
        if expires is not None and expires <= time.time():
            del self._data[key]
            return None
        return value

    def get(self, key: str) -> Optional[str]:
        with self._lock:
            return self._alive(key)

    def set(self, key: str, value: str, ex: Optional[int] = None, nx: bool = False) -> bool:
        with self._lock:
            if nx and self._alive(key) is not None:
                return False
            self._data[key] = (value, time.time() + ex if ex else None)
            return True

    def delete_if_equals(self, key: str, value: str) -> None:
        with self._lock:
            if self._alive(key) == value:
                del self._data[key]

    def ping(self) -> bool:
        return True


class RedisCache:
    name = "redis"

    # Only delete the lock if we still own it, atomically.
    _RELEASE = "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end"

    def __init__(self, url: str) -> None:
        import redis  # imported lazily so tests and local dev don't need a server

        self._r = redis.Redis.from_url(url, decode_responses=True, socket_timeout=5, health_check_interval=30)
        self._release = self._r.register_script(self._RELEASE)

    def get(self, key: str) -> Optional[str]:
        return self._r.get(key)

    def set(self, key: str, value: str, ex: Optional[int] = None, nx: bool = False) -> bool:
        return bool(self._r.set(key, value, ex=ex, nx=nx))

    def delete_if_equals(self, key: str, value: str) -> None:
        self._release(keys=[key], args=[value])

    def ping(self) -> bool:
        try:
            return bool(self._r.ping())
        except Exception:  # noqa: BLE001
            return False


def make_cache(redis_url: str):
    if redis_url:
        log.info("Using Redis cache")
        return RedisCache(redis_url)
    log.warning("REDIS_URL not set, using in-memory cache (fine for local dev only)")
    return MemoryCache()


def get_json(cache, key: str) -> Optional[Any]:
    raw = cache.get(key)
    return json.loads(raw) if raw else None


def set_json(cache, key: str, value: Any, ttl: int) -> None:
    cache.set(key, json.dumps(value, separators=(",", ":")), ex=ttl)
