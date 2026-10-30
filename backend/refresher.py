"""Background refresh pipeline.

Every REFRESH_INTERVAL_SECONDS: take the refresh lock so a background refresh and a
cold-start request never fetch at the same time, fetch FIRMS and USGS in parallel, and
store each dataset with a TTL. A source that fails leaves its previous data in place,
so the map keeps working.
"""

import logging
import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from typing import Callable, Optional

from cache import store_hazards
from config import KEY_FIRES, KEY_LOCK, KEY_QUAKES, Settings
import sources

log = logging.getLogger(__name__)


def _jobs(settings: Settings) -> dict[str, Callable[[], list]]:
    return {
        KEY_FIRES: lambda: sources.fetch_fires(settings.firms_map_key, settings.firms_days, settings.firms_min_frp),
        KEY_QUAKES: lambda: sources.fetch_earthquakes(settings.usgs_days),
    }


def _redact(text: str, settings: Settings) -> str:
    """Strip API keys from error messages (request URLs can contain them)."""
    for secret in (settings.firms_map_key, settings.ors_api_key):
        if secret:
            text = text.replace(secret, "***")
    return text


def refresh_once(cache, settings: Settings, only: Optional[str] = None) -> dict[str, str]:
    """Run one refresh (of every dataset, or just `only`).

    Returns a status per cache key, or {"lock": "busy"} if a refresh is already running.
    """
    token = uuid.uuid4().hex
    if not cache.set(KEY_LOCK, token, ex=settings.lock_ttl, nx=True):
        return {"lock": "busy"}

    status: dict[str, str] = {}
    try:
        jobs = {k: fn for k, fn in _jobs(settings).items() if only is None or k == only}
        with ThreadPoolExecutor(max_workers=len(jobs)) as pool:
            futures = {key: pool.submit(fn) for key, fn in jobs.items()}
            for key, future in futures.items():
                try:
                    data = future.result()
                    # Compressed once here, then sent to every browser as-is.
                    store_hazards(cache, key, data, settings.cache_ttl)
                    status[key] = f"ok ({len(data)})"
                except Exception as exc:  # noqa: BLE001
                    reason = _redact(str(exc), settings)
                    log.warning("refresh of %s failed, keeping previous cache: %s", key, reason)
                    status[key] = f"failed: {reason}"
                    # Remembered briefly so /api/health can say why a dataset is missing
                    cache.set(f"{key}:error", reason[:300], ex=settings.cache_ttl)
    finally:
        cache.delete_if_equals(KEY_LOCK, token)

    log.info("refresh finished: %s", status)
    return status


_started = False
_start_lock = threading.Lock()


def start_worker(cache, settings: Settings) -> None:
    """Start the refresh loop in a daemon thread, once per process."""
    global _started
    with _start_lock:
        if _started:
            return
        _started = True

    def loop() -> None:
        while True:
            try:
                refresh_once(cache, settings)
            except Exception:  # noqa: BLE001
                log.exception("refresh loop error")
            time.sleep(settings.refresh_interval)

    threading.Thread(target=loop, name="hazard-refresh", daemon=True).start()
