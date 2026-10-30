"""Cache backends.

Production uses Redis (e.g. Upstash) through REDIS_URL. Without it, an in-process
memory cache with the same small interface keeps local development dependency-free.
"""

import gzip
import json
import logging
import threading
import time
from typing import Any, Optional, Union

Value = Union[str, bytes]

log = logging.getLogger(__name__)


class MemoryCache:
    name = "memory"

    def __init__(self) -> None:
        self._data: dict[str, tuple[Value, Optional[float]]] = {}
        self._lock = threading.Lock()

    def _alive(self, key: str) -> Optional[Value]:
        item = self._data.get(key)
        if item is None:
            return None
        value, expires = item
        if expires is not None and expires <= time.time():
            del self._data[key]
            return None
        return value

    def get(self, key: str) -> Optional[Value]:
        with self._lock:
            return self._alive(key)

    def set(self, key: str, value: Value, ex: Optional[int] = None, nx: bool = False) -> bool:
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

        # Raw bytes: hazard payloads are stored gzip-compressed and served without decoding.
        self._r = redis.Redis.from_url(url, socket_timeout=5, health_check_interval=30)
        self._release = self._r.register_script(self._RELEASE)

    def get(self, key: str) -> Optional[bytes]:
        return self._r.get(key)

    def set(self, key: str, value: Value, ex: Optional[int] = None, nx: bool = False) -> bool:
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


GZIP_MAGIC = b"\x1f\x8b"


def is_gzip(raw: Value) -> bool:
    return isinstance(raw, bytes) and raw[:2] == GZIP_MAGIC


def get_json(cache, key: str) -> Optional[Any]:
    raw = cache.get(key)
    if not raw:
        return None
    return json.loads(gzip.decompress(raw) if is_gzip(raw) else raw)


def set_json(cache, key: str, value: Any, ttl: int, compress: bool = False) -> None:
    body = json.dumps(value, separators=(",", ":")).encode()
    cache.set(key, gzip.compress(body, compresslevel=6) if compress else body, ex=ttl)
