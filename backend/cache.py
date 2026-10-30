"""In-process cache for hazard data.

The app runs as a single process with several threads, so one dictionary guarded by a
lock is shared by every request and by the refresh worker. Hazard payloads are stored
gzip-compressed, next to a small metadata entry used for health checks and ETags.
"""

import gzip
import json
import threading
import time
from typing import Any, Optional, Union

Value = Union[str, bytes]


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


GZIP_MAGIC = b"\x1f\x8b"


def is_gzip(raw: Value) -> bool:
    return isinstance(raw, bytes) and raw[:2] == GZIP_MAGIC


def get_json(cache, key: str) -> Optional[Any]:
    raw = cache.get(key)
    if not raw:
        return None
    return json.loads(gzip.decompress(raw) if is_gzip(raw) else raw)


def get_meta(cache, key: str) -> Optional[dict]:
    raw = cache.get(f"{key}:meta")
    return json.loads(raw) if raw else None


def store_hazards(cache, key: str, data: list, ttl: int) -> None:
    """Compress a dataset once and store it with its metadata."""
    meta = {"updated_at": int(time.time() * 1000), "count": len(data)}
    body = json.dumps({**meta, "data": data}, separators=(",", ":")).encode()
    cache.set(key, gzip.compress(body, compresslevel=6), ex=ttl)
    cache.set(f"{key}:meta", json.dumps(meta), ex=ttl)
